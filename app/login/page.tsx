import { LoginForm } from "@/app/login/login-form";
import { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login | AquaLink",
  description: "Login to your AquaLink account",
};

// Fallback component to show while the LoginForm is loading
function LoginFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/Logo.png" 
              alt="AquaLink Logo" 
              width={120} 
              height={120} 
              priority
            />
          </div>
          <h1 className="text-3xl font-bold">AquaLink Monitoring</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
} 