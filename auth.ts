import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Adapter } from "@auth/core/adapters";
import { getDb } from "@/db/client";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isDatabaseConfigured } from "@/lib/app/environment";
import { findUserByEmailCaseInsensitive, syncFarmMembershipsForEmail } from "@/lib/repositories/user-access";

const databaseConfigured = isDatabaseConfigured();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: databaseConfigured ? createEmailAwareAdapter() : undefined,
  events: {
    async signIn({ user }) {
      if (!databaseConfigured || !user.id) {
        return;
      }

      await syncFarmMembershipsForEmail(getDb(), {
        email: user.email,
        userId: user.id,
      });
    },
  },
  pages: {
    signIn: "/entrar",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: databaseConfigured ? "database" : "jwt",
  },
  trustHost: true,
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === "google" && profile && "email_verified" in profile && profile.email_verified === false) {
        return false;
      }

      return true;
    },
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }

      return session;
    },
  },
});

function createEmailAwareAdapter(): Adapter {
  const adapter = DrizzleAdapter(getDb(), {
    accountsTable: accounts,
    sessionsTable: sessions,
    usersTable: users,
    verificationTokensTable: verificationTokens,
  });

  return {
    ...adapter,
    async createUser(user) {
      const existingUser = await findUserByEmailCaseInsensitive(getDb(), user.email);

      if (existingUser) {
        return existingUser;
      }

      if (!adapter.createUser) {
        throw new Error("Auth adapter createUser indisponivel.");
      }

      return adapter.createUser(user);
    },
    async getUserByEmail(email) {
      return findUserByEmailCaseInsensitive(getDb(), email);
    },
  };
}
