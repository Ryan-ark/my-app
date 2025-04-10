import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// Comment out the OAuth providers until you have real credentials
// import GithubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import { compare, hash } from "bcrypt";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import type { NextAuthOptions, SessionStrategy, User as NextAuthUser } from "next-auth";

// Define a User interface to match NextAuth's User type more closely
interface User {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  role?: string;
  image?: string | null;
}

// Define interfaces for our callback parameters
interface JWTCallbackParams {
  token: JWT;
  user: User | NextAuthUser;
}

interface SessionCallbackParams {
  session: Session;
  token: JWT;
}

// We'll use JWT-based sessions instead of database sessions
// This removes the need for the MongoDB adapter
export const authOptions: NextAuthOptions = {
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  debug: true, // Enable debug mode in both development and production for troubleshooting
  // Remove the adapter and use JWT for session management
  providers: [
    // Temporarily commenting out OAuth providers until you have real credentials
    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Log the received credentials for debugging
          console.log("Authorize function called with credentials:", { 
            email: credentials?.email ? credentials.email : "missing",
            passwordProvided: !!credentials?.password
          });

          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials", { email: !!credentials?.email, password: !!credentials?.password });
            return null;
          }
          
          // For testing purposes
          if (credentials.email === "user@example.com" && credentials.password === "password") {
            console.log("Using test account");
            return {
              id: "1",
              name: "Demo User",
              email: "user@example.com",
              role: "user",
            };
          }
          
          let client;
          try {
            client = await clientPromise;
            console.log("MongoDB connection successful");
          } catch (mongoError) {
            console.error("MongoDB connection error:", mongoError);
            // Return null instead of throwing
            return null;
          }
          
          const db = client.db();
          
          // Check if the user exists in the MongoDB database
          let user;
          try {
            user = await db.collection("users").findOne({ 
              email: credentials.email 
            });
            console.log("Database query successful, user found:", !!user);
          } catch (dbError) {
            console.error("Database query error:", dbError);
            // Return null instead of throwing
            return null;
          }
          
          // If user doesn't exist
          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }
          
          // Compare passwords
          let isValid = false;
          try {
            isValid = await compare(credentials.password, user.password);
            console.log("Password comparison result:", isValid);
          } catch (passwordError) {
            console.error("Password comparison error:", passwordError);
            // Return null instead of throwing
            return null;
          }
          
          // If password doesn't match
          if (!isValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }
          
          console.log("Login successful for:", credentials.email);
          // Return a clean user object (no sensitive data)
          return {
            id: user._id.toString(),
            name: user.name || null,
            email: user.email,
            role: user.preferences?.role || "user",
            image: user.image || null
          };
        } catch (error) {
          console.error("Authorize function error:", error);
          // Return null to prevent JSON parse errors
          return null;
        }
      }
    }),
  ],
  callbacks: {
    jwt({ token, user }: JWTCallbackParams) {
      try {
        if (user) {
          token.id = user.id;
          // Check if role exists before assigning
          if ('role' in user) {
            token.role = user.role;
          }
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return the original token in case of error
        return token;
      }
    },
    session({ session, token }: SessionCallbackParams) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error);
        // Return the original session in case of error
        return session;
      }
    },
  },
  pages: {
    signIn: "/login",
    // NextAuth v5 doesn't support signUp in pages config
    // Register page will still work through the link on login page
  },
  session: { 
    strategy: "jwt" as SessionStrategy 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// For Next.js App Router compatibility
export const auth = NextAuth(authOptions);

// Helper function to register a new user
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return { success: false, message: "User already exists" };
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Insert the new user
    await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      created: new Date(),
      preferences: {
        role: "user"
      }
    });
    
    return { 
      success: true, 
      message: "User registered successfully" 
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return { 
      success: false, 
      message: "An error occurred during registration" 
    };
  }
} 