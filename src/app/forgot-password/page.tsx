'use client';

import type { FC } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Logo from '@/components/logo';
import type { Metadata } from 'next';

// Metadata specific to the Forgot Password Page
// Note: In App Router, Metadata should ideally be defined in the page component itself or layout.
// Exporting it here works but might be moved depending on project structure evolution.
export const metadata: Metadata = {
  title: 'Forgot Password - Automata Control Center',
  description: 'Reset your password for the Automata Control Center.',
};

/**
 * Placeholder page for the "Forgot Password" functionality.
 * Currently provides information and a link back to the login page.
 * TODO: Implement actual password reset logic using Firebase Auth.
 */
const ForgotPasswordPage: FC = () => {
  // Placeholder state and function for future implementation
  // const [email, setEmail] = useState('');
  // const [isLoading, setIsLoading] = useState(false);
  // const [message, setMessage] = useState('');

  // const handlePasswordReset = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   setMessage('');
  //   try {
  //     // const auth = getAuth(firebaseApp);
  //     // await sendPasswordResetEmail(auth, email);
  //     setMessage('Password reset email sent. Please check your inbox.');
  //   } catch (error) {
  //     console.error("Password Reset Error:", error);
  //     setMessage('Failed to send password reset email. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md card text-center"> {/* Apply card shadow class */}
        <CardHeader className="space-y-2">
          <Logo className="mb-4 mx-auto w-12 h-12" />
          <CardTitle className="text-2xl font-semibold tracking-tight">Forgot Your Password?</CardTitle>
          <CardDescription>Password reset functionality is currently under development.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
           {/* Placeholder section for the actual form */}
           <p className="text-sm text-muted-foreground">
            This feature will allow you to reset your password via email. It is not yet implemented.
           </p>
          <Button asChild className="w-full btn"> {/* Use full width and btn class */}
            <Link href="/">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;