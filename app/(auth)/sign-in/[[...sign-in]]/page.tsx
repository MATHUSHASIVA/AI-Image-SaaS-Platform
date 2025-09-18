import { SignIn } from '@clerk/nextjs'

const SignInPage = () => {
  return (
    <SignIn 
      fallbackRedirectUrl="/" // Use this instead of afterSignInUrl
    />
  )
}

export default SignInPage