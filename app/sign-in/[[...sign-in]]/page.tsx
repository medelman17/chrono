import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Sign in to Chrono
        </h1>
        <SignIn />
      </div>
    </div>
  );
}