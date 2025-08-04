import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable for Inter
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Include needed weights
  variable: '--font-poppins', // CSS variable for Poppins
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Automata Control Center - Login', // Update title
  description: 'Login to the Automata Control Center', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply font variables to the body */}
      <body className={`${inter.variable} ${poppins.variable} antialiased font-sans`}>
        {children}
        <Toaster /> {/* Add Toaster for displaying messages */}
      </body>
    </html>
  );
}
