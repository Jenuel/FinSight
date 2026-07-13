from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from accounts.authentication import ClerkJWTAuthentication

ISSUER = "https://example.clerk.accounts.dev"
FRONTEND = "http://localhost:3000"

_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class _FakeSigningKey:
    key = _PRIVATE_KEY.public_key()


def _make_token(**overrides):
    payload = {
        "sub": "user_abc123",
        "iss": ISSUER,
        "azp": FRONTEND,
        "email": "person@example.com",
        "exp": 9999999999,
    }
    payload.update(overrides)
    for empty_key in [k for k, v in payload.items() if v is None]:
        del payload[empty_key]
    return jwt.encode(payload, _PRIVATE_KEY, algorithm="RS256")


@override_settings(
    CLERK_JWKS_URL="https://example.clerk.accounts.dev/.well-known/jwks.json",
    CLERK_ISSUER=ISSUER,
    CLERK_AUTHORIZED_PARTIES=[FRONTEND],
)
class ClerkJWTAuthenticationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.auth = ClerkJWTAuthentication()
        patcher = patch(
            "accounts.authentication._get_jwks_client"
        )
        mock_client_factory = patcher.start()
        self.addCleanup(patcher.stop)
        mock_client_factory.return_value.get_signing_key_from_jwt.return_value = (
            _FakeSigningKey()
        )

    def _authenticate(self, token):
        request = self.factory.get(
            "/api/accounts/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        return self.auth.authenticate(request)

    def test_valid_token_creates_user_with_email(self):
        user, _ = self._authenticate(_make_token())
        self.assertEqual(user.username, "user_abc123")
        self.assertEqual(user.email, "person@example.com")

    def test_email_synced_on_subsequent_login(self):
        User.objects.create(username="user_abc123", email="old@example.com")
        user, _ = self._authenticate(_make_token(email="new@example.com"))
        self.assertEqual(user.email, "new@example.com")

    def test_wrong_issuer_rejected(self):
        with self.assertRaises(AuthenticationFailed):
            self._authenticate(_make_token(iss="https://evil.example.com"))

    def test_unauthorized_party_rejected(self):
        with self.assertRaises(AuthenticationFailed):
            self._authenticate(_make_token(azp="https://evil.example.com"))

    def test_missing_authorization_header_returns_none(self):
        request = self.factory.get("/api/accounts/")
        self.assertIsNone(self.auth.authenticate(request))
