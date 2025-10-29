import { SignUp } from '@clerk/nextjs'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1ED] p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          }
        }}
        routing="path"
        path="/auth/sign-up"
        signInUrl="/auth/sign-in"
        redirectUrl="/dashboard"
      />
    </div>
  )
}
