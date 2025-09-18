import { SignUp } from '@clerk/nextjs'

const SignUpPage = () => {
  return (
    <SignUp 
      fallbackRedirectUrl="/" // Use this instead of afterSignUpUrl
    />
  )
}

export default SignUpPage