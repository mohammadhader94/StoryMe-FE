'use client';

import type { FC } from 'react';
// import { useEffect, useState } from 'react'; // No longer needed for auth check
// import { useRouter } from 'next/navigation'; // No longer needed for auth check
import Link from 'next/link'; // Import Link
// import { getAuth, onAuthStateChanged, User } from 'firebase/auth'; // No longer needed
// import { firebaseApp } from '@/lib/firebase'; // No longer needed for auth
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Skeleton } from '@/components/ui/skeleton'; // No longer needed for auth loading
import { ListOrdered } from 'lucide-react'; // Import an icon

const DashboardPage: FC = () => {
  // const router = useRouter(); // No longer needed for auth check
  // const auth = getAuth(firebaseApp); // No longer needed
  // const [user, setUser] = useState<User | null>(null); // No longer needed
  // const [loading, setLoading] = useState(true); // No longer needed

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     if (currentUser) {
  //       setUser(currentUser);
  //     } else {
  //       // If no user is signed in, redirect to login page
  //       router.push('/');
  //     }
  //     setLoading(false);
  //   });
  //
  //   // Cleanup subscription on unmount
  //   return () => unsubscribe();
  // }, [auth, router]);

  // const handleLogout = async () => {
  //   setLoading(true);
  //   try {
  //     await auth.signOut();
  //     router.push('/'); // Redirect to login page after logout
  //   } catch (error) {
  //     console.error("Logout Error:", error);
  //     // Handle logout error (e.g., show a toast message)
  //     setLoading(false);
  //   }
  // };

  // Remove loading state as auth check is disabled
  // if (loading) {
  //   // Show skeleton loaders while checking auth state
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-background p-4">
  //       <Card className="w-full max-w-lg shadow-lg card"> {/* Added card class */}
  //         <CardHeader>
  //           <Skeleton className="h-8 w-3/4 mb-2" /> {/* Skeleton for title */}
  //           <Skeleton className="h-4 w-1/2" /> {/* Skeleton for description */}
  //         </CardHeader>
  //         <CardContent className="space-y-4">
  //            <Skeleton className="h-6 w-full" />
  //            <Skeleton className="h-6 w-4/5" /> {/* Skeleton for link */}
  //            <Skeleton className="h-10 w-24" /> {/* Skeleton for button */}
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg text-center shadow-lg card"> {/* Added card class */}
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Dashboard</CardTitle>
           {/* Update description as user info is not available */}
           <CardDescription>Welcome to the Automata Control Center!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6"> {/* Added padding top */}
           <p className="text-muted-foreground">This is your main control center.</p>

           {/* Link to Orders Page */}
           <Button asChild variant="outline" className="w-full btn">
             <Link href="/orders">
                <ListOrdered className="mr-2 h-4 w-4" />
               View Orders
             </Link>
           </Button>

           {/* Logout Button Removed */}
           {/* <Button onClick={handleLogout} disabled={loading} className="w-full btn" variant="secondary">
             Logout
           </Button> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
