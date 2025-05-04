import Layout from '@/components/layout/Layout';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <Layout>
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create a new account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <SignupForm />
        </div>
      </div>
    </Layout>
  );
}