import Header from '@/components/shared/Header'
import TransformationForm from '@/components/shared/TransformationForm';
import { transformationTypes } from '@/constants'
import { getOrCreateUser } from '@/lib/actions/user.actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

// Create a type for valid transformation types
type ValidTransformationType = keyof typeof transformationTypes;

const AddTransformationTypePage = async ({ params }: { params: Promise<{ type: string }> }) => {
  const { type } = await params;
  const { userId } = await auth();
  
  // Check if type is valid and assert the type
  if (!(type in transformationTypes)) {
    notFound();
  }
  
  // Now TypeScript knows type is a valid key
  const validType = type as ValidTransformationType;
  const transformation = transformationTypes[validType];

  if(!userId) redirect('/sign-in');

  // This will now create the user if they don't exist
  const user = await getOrCreateUser(userId);
  
  if (!user) {
    console.error("Failed to get or create user");
    redirect('/sign-in');
  }

  return (
    <>
      <Header 
        title={transformation.title}
        subtitle={transformation.subTitle}
      />
    
      <section className="mt-10">
        <TransformationForm 
          action="Add"
          userId={user._id}
          type={transformation.type as TransformationTypeKey}
          creditBalance={user.creditBalance}
        />
      </section>
    </>
  )
}

export default AddTransformationTypePage