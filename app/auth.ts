import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import clientPromise from "@/app/lib/mongodb";
import { hash } from "bcrypt";

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

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