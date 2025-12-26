import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtected = nextUrl.pathname.startsWith("/protected");
      const isOnAuth = nextUrl.pathname.startsWith("/auth");

      if (isOnProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/protected", nextUrl));
        }
        return true;
      }
      return true;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
