# Authentication Implementation Plan

This document outlines the plan for implementing the authentication system for the Scrabble league application.

## Overview

The system will distinguish between "guest" (unauthenticated) and "connected" (authenticated) users. Connected users, who are registered participants in the league, will have access to additional features. Authentication will be handled using Google OAuth via NextAuth.js.

## Phases

### Phase 1: NextAuth.js Setup and Basic Authentication

1.  **Install NextAuth.js:**
    ```bash
    npm install next-auth
    ```

2.  **Configure NextAuth.js:**
    *   Create (or modify) `src/app/api/auth/[...nextauth]/route.ts`:

        ```typescript
        import NextAuth from "next-auth"
        import GoogleProvider from "next-auth/providers/google"
        import { readFileSync } from 'fs';

        const loadPlayers = () => {
          try {
            const data = readFileSync('data/players.json', 'utf8');
            return JSON.parse(data).players;
          } catch (error) {
            console.error("Error reading players.json:", error);
            return []; // Return an empty array if there's an error
          }
        };

        export const authOptions = {
          providers: [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID || "",
              clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            }),
          ],
          session: {
            strategy: "jwt",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            updateAge: 24 * 60 * 60, // 24 hours
          },
          callbacks: {
            async signIn({ user, account, profile, email, credentials }) {
              const players = loadPlayers();
              if (players.length === 0) {
                return true; // Allow sign-in if players.json is empty (initial setup)
              }
              const isAllowed = players.some((player) => player.email === user.email && user.email !== null);
              return isAllowed;
            },
            async jwt({ token, user, account, profile, isNewUser }) {
              if (user) {
                // Find the player in players.json and add their ID to the token
                const players = loadPlayers();
                const player = players.find(p => p.email === user.email);
                if (player) {
                  token.playerId = player.id;
                }
              }
              return token;
            },
            async session({ session, token, user }) {
              // Add the player ID to the session
              if (token.playerId) {
                session.user.playerId = token.playerId;
              }
              return session;
            },
          },
        }
        const handler = NextAuth(authOptions);

        export { handler as GET, handler as POST }
        ```

    *   **Session Persistence:** The `session` configuration ensures that users remain logged in for 30 days (with a 24-hour update window) as long as they use the same browser.  This eliminates the need for frequent re-authentication.

    *   Define callbacks:
        *   `signIn`: Reads `data/players.json`, checks if the user's email is present and not `None`, and allows or prevents sign-in.
        *   `jwt`: Adds the player's ID to the JWT.
        *   `session`: Includes the player ID in the session object.

3.  **Modify `data/players.json`:** Add an `email` field to each player object. Initially, set all email fields to `None`.

4.  **Basic UI Integration:**
    *   Add a "Sign in with Google" button. Use `signIn('google', { callbackUrl: '/protected-page' })` from `next-auth/react`.
    *   Add a "Sign out" button. Use `signOut()` from `next-auth/react`.
    *   Display user information conditionally. Use `useSession()` from `next-auth/react`. Example (`src/app/components/AuthStatus.tsx`):

        ```typescript
        // src/app/components/AuthStatus.tsx
        'use client';
        import { useSession, signIn, signOut } from 'next-auth/react';

        export default function AuthStatus() {
          const { data: session, status } = useSession();

          if (status === 'loading') {
            return <div>Loading...</div>;
          }

          if (session) {
            return (
              <div>
                <p>Signed in as {session.user?.email}</p>
                <button onClick={() => signOut()}>Sign out</button>
              </div>
            );
          }

          return (
            <div>
              <p>Not signed in</p>
              <button onClick={() => signIn('google')}>Sign in with Google</button>
            </div>
          );
        }

        ```

### Phase 2: Route Protection and Redirections

1.  **Update Middleware:** Modify `src/middleware.ts`:

    ```typescript
    // src/middleware.ts
    import { getToken } from "next-auth/jwt";
    import { NextResponse } from 'next/server';
    import type { NextRequest } from 'next/server';

    export async function middleware(req: NextRequest) {
      const session = await getToken({ req });
      const protectedPaths = ['/dashboard', '/my-matches', '/admin']; // Add protected paths
      const path = req.nextUrl.pathname;

      const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));

      if (isProtectedPath && !session) {
        const callbackUrl = req.nextUrl.pathname;
        return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${callbackUrl}`, req.url));
      }

      return NextResponse.next();
    }

    export const config = {
      matcher: [
        '/dashboard/:path*',
        '/my-matches/:path*',
        '/admin/:path*',
        /* Other protected paths */
      ],
    };

    ```

2.  **Protect API Routes:** Ensure API routes for protected features check for authentication (using middleware or within the route handlers). Example (`src/app/api/my-data/route.ts`):

    ```typescript
    // src/app/api/my-data/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { authOptions } from '../auth/[...nextauth]/route'; // Import authOptions
    import { getServerSession } from "next-auth/next"

    export async function GET(req: NextRequest) {
      const session = await getServerSession(authOptions); // Use getServerSession

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // ... logic to fetch and return data ...
    }
    ```

### Phase 3: Session Persistence

Already handled by the `session` configuration in Phase 1.

### Phase 4: UI/UX Enhancements

1.  **Navigation Indicators:**
    *   Conditionally render the "Espace Joueur" or "Mon Tableau de Bord" link based on the user's authentication status (using `useSession()`).
    *   **Important:** Ensure the link to the player's personal page is prominently displayed, likely in the main navigation.  The current location is not ideal.
    *   Use a clear visual indicator (user icon, name) for login status.

2.  **Contextual Messages:**
    *   Display messages when unauthenticated users try to access protected features. **Login should be triggered when a user attempts an action that requires authentication, such as submitting match scores.** This can be implemented using a modal, a dedicated login page, or by redirecting to the login page with a `callbackUrl`.

3.  **Transitions:** Use CSS or libraries like `framer-motion` for smooth transitions.

4.  **Visual Distinction:** Apply specific styles to elements visible only to logged-in users.

### Phase 5: Testing and Deployment

1.  **Thorough Testing:** Test all aspects of the authentication flow.
2.  **Deployment:** Deploy incrementally.

## Mermaid Diagram

```mermaid
graph LR
    A[User visits page] --> B{Is user logged in?};
    B -- Yes --> C[Show protected content];
    B -- No --> D{Is page protected?};
    D -- Yes --> E[Redirect to login];
    D -- No --> F[Show public content];
    E --> G[Login with Google];
    G --> H{Is user authorized?};
    H -- Yes --> C;
    H -- No --> I[Show error message];
    H -- Check email --> J[Read players.json];
    J --> H;