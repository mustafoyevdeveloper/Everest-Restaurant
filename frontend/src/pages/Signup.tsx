import React from 'react';
import { Button } from '@/components/ui/button';

const Signup: React.FC = () => {
  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-6 rounded shadow-md w-full max-w-sm flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-center">Sign up with Google</h2>
        <Button onClick={handleGoogleSignup} className="w-full bg-red-500 hover:bg-red-600 text-white">
          Continue with Google
        </Button>
      </div>
    </div>
  );
};

export default Signup;
