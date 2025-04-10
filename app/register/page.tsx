import { RegisterForm } from "@/app/register/register-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Register | AquaLink",
  description: "Create your AquaLink account",
};

// Fallback component to show while the RegisterForm is loading
function RegisterFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      <div className="h-12 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="mt-2 text-gray-600">Sign up to get started</p>
        </div>
        <Suspense fallback={<RegisterFormSkeleton />}>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
} 