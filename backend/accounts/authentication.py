import logging
from functools import lru_cache

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

User = get_user_model()


@lru_cache(maxsize=4)
def _get_jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    """
    Return a cached PyJWKClient for a JWKS URL.

    The client is built once per URL (lru_cache) and caches the fetched key
    set internally (cache_jwk_set) for `lifespan` seconds, so the signing keys
    are fetched once and reused across requests instead of on every request.
    """
    return jwt.PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)


class ClerkJWTAuthentication(BaseAuthentication):
    """
    Authenticates requests using a Clerk-issued RS256 JWT passed as:
        Authorization: Bearer <token>

    Verification steps:
    1. Extract the token from the Authorization header.
    2. Resolve the signing key from Clerk's (cached) JWKS via the token's kid.
    3. Decode + verify the token: signature, expiry, and issuer (iss).
    4. Verify the authorized party (azp) against the configured allow-list.
    5. Map the Clerk user ID (sub claim) to a local Django User, creating one
       on first login and syncing the email on every login.
    """

    def authenticate_header(self, request):
        """
        Return the WWW-Authenticate header value for rejected requests.

        Without this, DRF cannot build a challenge and downgrades every
        unauthenticated response from 401 to 403, which tells a client it is
        forbidden rather than that it needs to log in.
        """
        return 'Bearer realm="api"'

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None  # No token - let DRF fall through to other authenticators

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        jwks_url = getattr(settings, "CLERK_JWKS_URL", "")
        if not jwks_url:
            raise AuthenticationFailed(
                "CLERK_JWKS_URL is not configured in Django settings."
            )

        # Resolve the signing key from the cached JWKS (fetched once, not per request).
        try:
            signing_key = _get_jwks_client(jwks_url).get_signing_key_from_jwt(token)
        except jwt.exceptions.PyJWKClientError as e:
            logger.warning("Clerk JWKS/signing-key lookup failed: %s", e)
            raise AuthenticationFailed(
                "Unable to resolve the signing key from Clerk JWKS."
            )
        except jwt.exceptions.DecodeError:
            raise AuthenticationFailed("Invalid token format.")

        # Verify signature, expiry, and issuer.
        decode_options = {"verify_aud": False, "require": ["exp", "sub"]}
        decode_kwargs = {"algorithms": ["RS256"], "options": decode_options}

        issuer = getattr(settings, "CLERK_ISSUER", "")
        if issuer:
            decode_kwargs["issuer"] = issuer
            decode_options["verify_iss"] = True

        try:
            payload = jwt.decode(token, signing_key.key, **decode_kwargs)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.InvalidIssuerError:
            raise AuthenticationFailed("Token issuer (iss) is not trusted.")
        except jwt.MissingRequiredClaimError as e:
            raise AuthenticationFailed(f"Token is missing a required claim: {e}")
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f"Invalid token: {e}")

        # Verify the authorized party (azp) against the allow-list, when configured.
        # Clerk recommends this as defense-in-depth against token reuse from an
        # unexpected frontend origin. Only enforced when CLERK_AUTHORIZED_PARTIES
        # is set and the token carries an azp claim.
        authorized_parties = getattr(settings, "CLERK_AUTHORIZED_PARTIES", [])
        if authorized_parties:
            azp = payload.get("azp")
            if azp and azp not in authorized_parties:
                raise AuthenticationFailed(
                    "Token 'azp' claim is not an authorized party."
                )

        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise AuthenticationFailed("Token is missing the 'sub' claim.")

        email = payload.get("email", "") or ""

        user = self._get_or_sync_user(clerk_user_id, email)
        return (user, token)

    @staticmethod
    def _get_or_sync_user(clerk_user_id: str, email: str) -> AbstractBaseUser:
        """
        Map a Clerk user ID to a local Django User (lazy creation on first
        login), keeping the stored email in sync with the token on each login.
        """
        user, created = User.objects.get_or_create(
            username=clerk_user_id,
            defaults={"email": email},
        )
        if not created and email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])
        return user
