import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "../db/client"

const customAdapter = PrismaAdapter(prisma);
const originalDeleteSession = customAdapter.deleteSession;
if (originalDeleteSession) {
  // @ts-ignore - TypeScript union of Promise types mismatch
  customAdapter.deleteSession = async (sessionToken) => {
    try {
      return await originalDeleteSession(sessionToken);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return;
      }
      throw error;
    }
  };
}

export const authConfig = {
  trustHost: true,
  adapter: customAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    session: async ({ session, user }: any) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
} as any;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
