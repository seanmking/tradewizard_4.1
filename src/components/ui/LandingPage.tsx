import React, { useState } from 'react';
import UserInputForm from '../forms/UserInputForm';

const LandingPage: React.FC<{ onStart: (data: { name: string; email: string; url: string }) => Promise<void> }> = ({ onStart }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: { name: string; email: string; url: string }) => {
    setLoading(true);
    setError('');
    try {
      await onStart(data);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Failed to start assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-50">
      <header className="w-full py-8 bg-primary text-white text-center shadow">
        <h1 className="text-3xl font-bold tracking-tight">TradeWizard 4.1</h1>
        <p className="mt-2 text-lg font-medium">Export Readiness Assessment for SMEs</p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-lg mx-auto">
        <section className="mb-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="text-gray-600">Enter your details to begin your export readiness assessment. This helps us personalize your experience.</p>
        </section>
        {!success ? (
          <UserInputForm onSubmit={handleSubmit} loading={loading} />
        ) : (
          <div className="text-green-700 font-semibold">Assessment started! Redirecting...</div>
        )}
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </main>
      <footer className="w-full py-4 text-center text-gray-500 text-xs bg-white border-t mt-8">
        &copy; {new Date().getFullYear()} TradeWizard. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
