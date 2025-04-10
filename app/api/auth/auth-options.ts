import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/app/lib/mongodb";
import { compare } from "bcrypt";

// Ensure we use the correct URL for different environments
// const getBaseUrl = () => {
//   if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
//   if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
//   return "http://localhost:3000";
// };

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          
          // For testing purposes
          if (credentials.email === "user@example.com" && credentials.password === "password") {
            return {
              id: "1",
              name: "Demo User",
              email: "user@example.com",
              role: "user",
            };
          }
          
          const client = await clientPromise;
          const db = client.db();
          
          const user = await db.collection("users").findOne({ 
            email: credentials.email 
          });
          
          if (!user) {
            return null;
          }
          
          const isValid = await compare(credentials.password, user.password);
          
          if (!isValid) {
            return null;
          }
          
          return {
            id: user._id.toString(),
            name: user.name || null,
            email: user.email,
            role: user.preferences?.role || "user",
            image: user.image || null
          };
        } catch (error) {
          console.error("Authorize function error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ('role' in user) {
          token.role = user.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { 
    strategy: "jwt" 
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Add this to use the correct URL in both development and production
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}; 