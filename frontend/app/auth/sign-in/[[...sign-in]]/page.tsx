import { SignIn } from '@clerk/nextjs'

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1ED] p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          }
        }}
        routing="path"
        path="/auth/sign-in"
        signUpUrl="/auth/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  )
}
