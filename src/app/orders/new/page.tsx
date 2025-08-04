
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label"; // No longer needed for file input
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
// Remove Firestore/Storage imports
// import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { firebaseApp, db } from '@/lib/firebase';
import type { OrderData, Attachment } from '@/types/order'; // Keep OrderData structure (minus timestamps)
import { addOrder } from '@/services/orderService'; // Import mock addOrder
import { Loader2 } from 'lucide-react';

// Define Zod schema based on Google Form fields
// No changes needed here unless form fields changed significantly
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).min(1, { message: "Email Address is required." }),
  customerName: z.string().min(1, { message: "Customer Name is required." }),
  orderSummary: z.string().min(1, { message: "Story Title / Request Summary is required." }),
  storyType: z.string().optional(),
  language: z.string().optional(),
  specialRequests: z.string().optional(),
});

// Type for data passed to the mock addOrder function
// Excludes fields automatically added by the service (id, status, timestamps)
type NewOrderInput = Omit<OrderData, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'attachments'> & { attachments?: Attachment[] };


const NewOrderPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  // Remove file state
  // const [file, setFile] = useState<File | null>(null);
  // const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Remove Firebase initialization check
  // if (!firebaseApp || !db) { ... }

  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      customerName: "",
      orderSummary: "",
      storyType: "",
      language: "",
      specialRequests: "",
    },
  });

  // Remove file change handler
  // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { ... };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    // Construct the data for the mock service
    // Note: Attachments are currently removed, but could be added back
    // if mock service supports simple attachment URLs or names
    const newOrderData: NewOrderInput = {
      email: values.email,
      customerName: values.customerName,
      orderSummary: values.orderSummary,
      storyType: values.storyType || undefined,
      language: values.language || undefined,
      specialRequests: values.specialRequests || undefined,
      // attachments: [], // No attachments for now
    };

    try {
      // Call the mock service function
      const newOrderId = await addOrder(newOrderData);
      toast({
        title: "Success",
        description: `Mock order created successfully! (ID: ${newOrderId})`,
      });
      router.push('/orders'); // Navigate back to orders list
    } catch (error) {
      console.error('Error creating mock order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error creating mock order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 flex items-start justify-center min-h-screen">
      <Card className="w-full max-w-2xl card shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Create New Order</CardTitle>
          <CardDescription>Fill in the details below to submit a new story request.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Customer Name Field */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Order Summary Field */}
              <FormField
                control={form.control}
                name="orderSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title / Request Summary <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe the story or request" {...field} />
                    </FormControl>
                     <FormDescription>
                        Keep it concise but informative.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Story Type Field */}
              <FormField
                control={form.control}
                name="storyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select story type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Custom Adventure">Custom Adventure</SelectItem>
                          <SelectItem value="Birthday Story">Birthday Story</SelectItem>
                          <SelectItem value="Learning Story">Learning Story</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Language Field */}
               <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Language</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Arabic">Arabic</SelectItem>
                          <SelectItem value="Bilingual (English & Arabic)">Bilingual (English & Arabic)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Special Requests Field */}
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific characters, themes, or details to include?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Removed File Upload Section */}
              {/*
              <div className="space-y-2">
                <Label htmlFor="fileUpload">File Upload (Optional)</Label>
                 <Input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                 />
                {fileName && <p className="text-sm text-muted-foreground mt-1">Selected: {fileName}</p>}
                <FormDescription>
                    Upload any relevant files (e.g., reference images, documents). Max size: 5MB.
                </FormDescription>
              </div>
              */}

             <CardFooter className="pt-8 px-0">
                <Button type="submit" className="w-full btn" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Creating Mock Order..." : "Create Mock Order"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrderPage;
