import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Next 16 renamed the `middleware` file convention to `proxy`; the exported
// function must be the default export or named `proxy`.
//
// Clerk runs here so the session is verified at the network boundary and
// server-side auth context is available before any route renders. In local demo
// mode there are no Clerk keys, and calling clerkMiddleware() without them
// throws on every request — so it is skipped entirely rather than failing open
// on a misconfiguration.
const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default isClerkEnabled ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: [
    // Everything except Next internals and static assets, unless a search param
    // is present (so server-rendered data requests still pass through Clerk).
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
