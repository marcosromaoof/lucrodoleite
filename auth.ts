import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db/client";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isDatabaseConfigured } from "@/lib/app/environment";

const databaseConfigured = isDatabaseConfigured();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: databaseConfigured
    ? DrizzleAdapter(getDb(), {
        accountsTable: accounts,
        sessionsTable: sessions,
        usersTable: users,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  pages: {
    signIn: "/entrar",
  },
  providers: [Google],
  session: {
    strategy: databaseConfigured ? "database" : "jwt",
  },
  trustHost: true,
  callbacks: {
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }

      return session;
    },
  },
});
