import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { hash } from "bcrypt";

// Helper function to register a new user
async function registerUser(
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

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Register the user
    const result = await registerUser(name, email, password);

    if (!result.success) {
      return NextResponse.json(
        { message: result.message || "Registration failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 