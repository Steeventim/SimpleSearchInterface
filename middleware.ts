export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (all API routes - they handle auth internally)
         * - login (login page)
         * - signup (signup page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|login|signup|_next/static|_next/image|favicon.ico).*)",
    ],
};
