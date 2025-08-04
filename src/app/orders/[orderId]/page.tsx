
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react'; // Import useState/useEffect
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'; // Ensure useQueryClient is imported
import { format } from 'date-fns';
import Image from 'next/image'; // Import next/image
import {
    AlertTriangle, CheckCircle, Download, Info, Loader2, Paperclip, ArrowLeft, AlertCircle, Mail, RefreshCw, Check, BookOpen, Image as ImageIconLucide, Copy, Maximize, UploadCloud, FileText, AlertOctagon, XCircle, Send, PackageCheck, Sparkles, Eye, Edit, UserCheck // Added Edit, UserCheck
} from 'lucide-react'; // Added FileText, AlertOctagon, XCircle

import {
    getOrderById,
    updateOrder,
    updateStoryPageTextStatus,
    regenerateStoryPageText,
    updateStoryPagePromptStatus, // Keep for potential internal use or future features
    regenerateStoryPagePrompt,
    updateStoryPageImageStatus,
    // regenerateStoryPageImage, // Replaced by generateMidJourneyImage
    generateMidJourneyImage, // New function to trigger generation
    selectMidJourneyImageQuadrant, // New function to select quadrant
    approveFinalStory,
    requestCorrection,
    deliverOrder, // New function for delivering the order
    generateCharacterSheet, // NEW: Function for character sheet generation
    acceptCharacterSheet, // NEW: Function for accepting character sheet
} from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderStatus, Attachment, StoryPage, OrderStage, PageItemStatus, FinalStory, AssemblyStatus, DeliveryInfo, MockTimestamp, CharacterSheet, CharacterSheetStatus } from '@/types/order'; // Use MockTimestamp, import CharacterSheet types
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils"; // Ensure cn is imported
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import { Input } from '@/components/ui/input'; // Import Input for photo upload simulation
import { Label } from '@/components/ui/label'; // Import Label
import { AxiosError } from 'axios'; // Ensure AxiosError is imported if used in mutations

// Status styles - Added 'delivered'
const statusStyles: Record<OrderStatus, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
  pending: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending' },
  in_progress: { variant: 'default', icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />, label: 'In Progress' },
  completed: { variant: 'outline', icon: <CheckCircle className="mr-1 h-3 w-3 text-green-600" />, label: 'Ready to Deliver' }, // Updated label
  failed: { variant: 'destructive', icon: <AlertCircle className="mr-1 h-3 w-3" />, label: 'Failed' },
  delivered: { variant: 'outline', icon: <PackageCheck className="mr-1 h-3 w-3 text-primary" />, label: 'Delivered' }, // Added delivered status
};

// Styles for Order Stage - Added 'character_sheet_generation'
const stageStyles: Record<OrderStage, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
    character_sheet_generation: { variant: 'default', icon: <UserCheck className="mr-1 h-3 w-3" />, label: 'Character Sheet' }, // NEW Stage
    pending_approval: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending Approval' },
    story_content_generation: { variant: 'default', icon: <BookOpen className="mr-1 h-3 w-3" />, label: 'Story Text Gen' },
    visual_content_generation: { variant: 'default', icon: <Sparkles className="mr-1 h-3 w-3" />, label: 'Visual Content Gen' }, // Combined Stage
    final_review: { variant: 'default', icon: <FileText className="mr-1 h-3 w-3" />, label: 'Final Review' }, // Updated label and icon
    completed: { variant: 'outline', icon: <CheckCircle className="mr-1 h-3 w-3 text-green-600" />, label: 'Ready to Deliver' }, // Updated label
    failed: { variant: 'destructive', icon: <AlertCircle className="mr-1 h-3 w-3" />, label: 'Failed' },
    delivered: { variant: 'outline', icon: <PackageCheck className="mr-1 h-3 w-3 text-primary" />, label: 'Delivered' }, // Added delivered stage
};

// Styles for Story Page Item Status (Text, Prompt, Image)
const pageItemStatusStyles: Record<PageItemStatus, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
    pending: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending Review' },
    accepted: { variant: 'outline', icon: <Check className="mr-1 h-3 w-3 text-green-600" />, label: 'Accepted' }, // Label might need context (e.g. "Accepted for Image Gen")
    regenerating: { variant: 'default', icon: <Loader2 className="mr-1 h-3 w-3 animate-spin" />, label: 'Generating...' }, // Updated label
};

// Styles for Character Sheet Status
const characterSheetStatusStyles: Record<CharacterSheetStatus, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
    pending: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending Review' },
    accepted: { variant: 'outline', icon: <Check className="mr-1 h-3 w-3 text-green-600" />, label: 'Accepted' },
};


// Styles for Final Story Assembly Status
const assemblyStatusStyles: Record<AssemblyStatus, { variant: BadgeProps['variant'], icon: React.ReactNode, label: string }> = {
    pending: { variant: 'secondary', icon: <Info className="mr-1 h-3 w-3" />, label: 'Pending Final Review' },
    approved: { variant: 'outline', icon: <CheckCircle className="mr-1 h-3 w-3 text-green-600" />, label: 'Approved (Ready)' }, // Updated label
    needs_correction: { variant: 'destructive', icon: <AlertOctagon className="mr-1 h-3 w-3" />, label: 'Needs Correction' },
};


// Helper to format MockTimestamps safely
const formatTimestamp = (ts: MockTimestamp | Date | string | number | undefined): string => {
    if (!ts) return 'N/A';

    let dateObj: Date | undefined;

    try {
        // Check if it's our mock timestamp object
        if (typeof ts === 'object' && ts !== null && 'seconds' in ts && 'nanoseconds' in ts && typeof ts.seconds === 'number') {
            dateObj = new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000);
        }
        // Check if it's already a Date object or a valid date string/number
        else if (ts instanceof Date || typeof ts === 'string' || typeof ts === 'number') {
            dateObj = new Date(ts);
        }
    } catch (e) {
        console.error("Error creating Date from value:", ts, e);
        return 'Invalid Date';
    }

    // Validate the resulting Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        console.error("formatTimestamp: Resulted in an invalid Date object:", ts);
        return 'Invalid Date';
    }

    // Format the valid date
    try {
        return format(dateObj, 'dd MMM yyyy, HH:mm');
    } catch (e) {
        console.error("Error formatting Date object:", dateObj, e);
        return 'Formatting Error';
    }
};


const OrderDetailsPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const queryClient = useQueryClient(); // Get query client instance


  // Fetch order data using the mock service
  const { data: order, isLoading, isError, error, status: queryStatus, refetch } = useQuery<Order | null, Error>({
    queryKey: ['order', orderId],
    queryFn: async () => {
         console.log(`OrderDetailsPage: Running queryFn for MOCK orderId: ${orderId}`);
         if (!orderId) return null;
         const fetchedOrder = await getOrderById(orderId);
         console.log(`OrderDetailsPage: MOCK QueryFn result for ${orderId}:`, fetchedOrder);
         return fetchedOrder;
    },
    enabled: !!orderId,
  });

  // Local state for the editable character sheet prompt (moved to top level)
  const [characterSheetPrompt, setCharacterSheetPrompt] = useState<string>('');

  // Effect to update local prompt state when order data changes (moved to top level)
   useEffect(() => {
     if (order?.characterSheet?.prompt) {
       setCharacterSheetPrompt(order.characterSheet.prompt);
     } else if (!order && !isLoading) {
        // Reset prompt if order is not found or loading finished without order
        setCharacterSheetPrompt('');
     }
   }, [order, isLoading]); // Depend on order object and loading state


  // --- MUTATIONS ---

  // Mutation for general order updates (status, stage, finalStory, deliveryInfo, storyPages, characterSheet)
  const updateOrderMutation = useMutation({
    mutationFn: (updates: Partial<Pick<Order, 'status' | 'stage' | 'finalStory' | 'deliveryInfo' | 'storyPages' | 'characterSheet'>>) => {
        if (!orderId) throw new Error("Cannot update: Order ID is missing.");
        return updateOrder(orderId, updates);
    },
    onSuccess: (_, variables) => {
      let description = `Mock order ${orderId} updated successfully.`;
      if (variables.stage) description += ` New stage: ${stageStyles[variables.stage]?.label || variables.stage}.`;
      if (variables.status) description += ` New status: ${statusStyles[variables.status]?.label || variables.status}.`;
      if (variables.characterSheet) description += ` Character Sheet updated.`;
      if (variables.storyPages) description += ` Story pages updated.`; // Simple message for page updates
      if (variables.finalStory) description += ` Final story status: ${assemblyStatusStyles[variables.finalStory.assemblyStatus]?.label || variables.finalStory.assemblyStatus}.`;
      if (variables.deliveryInfo) description += ` Delivery info updated.`;


      toast({
        title: "Order Updated",
        description: description.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list too
    },
    onError: (err: Error) => {
      console.error(`OrderDetailsPage: MOCK Update error for order ${orderId}:`, err);
      toast({ variant: "destructive", title: "Update Failed", description: err.message || "Could not update mock order." });
    },
  });

  // --- CHARACTER SHEET Mutations ---
  const generateCharacterSheetMutation = useMutation({
    mutationFn: (prompt: string) => {
        if (!orderId) throw new Error("Order ID is missing.");
        return generateCharacterSheet(orderId, prompt);
    },
     onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ['order', orderId] });
        const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
        // Optimistically set status to generating (though backend handles this, good for UI feedback)
        if (previousOrder?.characterSheet) {
             queryClient.setQueryData<Order>(['order', orderId], { ...previousOrder, characterSheet: { ...previousOrder.characterSheet, imageUrl: undefined }}); // Clear image URL optimistically
        }
        return { previousOrder };
    },
    onSuccess: () => {
        toast({ title: "Character Sheet Generation Started", description: `Generating character sheet for order ${orderId}. Please wait... (Mock)` });
        // Invalidate after a delay to simulate webhook completion
        setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }, 8000); // ~7s character sheet gen delay + buffer
    },
    onError: (err: Error, variables, context) => {
        console.error(`Error generating character sheet for order ${orderId}:`, err);
        const message = err instanceof AxiosError ? err.response?.data?.message || err.message : err.message;
        toast({ variant: "destructive", title: "Character Sheet Generation Failed", description: message || "Could not start character sheet generation." });
        if (context?.previousOrder) queryClient.setQueryData(['order', orderId], context.previousOrder);
        else queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  const acceptCharacterSheetMutation = useMutation({
    mutationFn: () => {
        if (!orderId) throw new Error("Order ID is missing.");
        return acceptCharacterSheet(orderId);
    },
    onSuccess: () => {
        toast({ title: "Character Sheet Accepted", description: `Character sheet approved for order ${orderId}. Moved to Story Text Generation.` });
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list as stage changed
    },
    onError: (err: Error) => {
        console.error(`Error accepting character sheet for order ${orderId}:`, err);
        toast({ variant: "destructive", title: "Acceptance Failed", description: err.message || "Could not accept the character sheet." });
    },
  });


  // --- TEXT Mutations ---
   const updatePageTextStatusMutation = useMutation({
       mutationFn: ({ pageNumber, newStatus }: { pageNumber: number, newStatus: PageItemStatus }) => {
           if (!orderId) throw new Error("Order ID is missing.");
           return updateStoryPageTextStatus(orderId, pageNumber, newStatus);
       },
       onSuccess: (_, variables) => {
           toast({ title: "Text Status Updated", description: `Page ${variables.pageNumber} text status set to ${pageItemStatusStyles[variables.newStatus].label}.` });
           queryClient.invalidateQueries({ queryKey: ['order', orderId] });
           queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list if stage might change
       },
       onError: (err: Error, variables) => {
           console.error(`Error updating text status for page ${variables.pageNumber}:`, err);
           toast({ variant: "destructive", title: "Text Update Failed", description: err.message || "Could not update page text status." });
       },
   });
   const regeneratePageTextMutation = useMutation({
       mutationFn: (pageNumber: number) => {
           if (!orderId) throw new Error("Order ID is missing.");
           return regenerateStoryPageText(orderId, pageNumber);
       },
       onMutate: async (pageNumber) => {
           await queryClient.cancelQueries({ queryKey: ['order', orderId] });
           const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
           if (previousOrder?.storyPages) {
               const updatedPages = previousOrder.storyPages.map(p =>
                   p.pageNumber === pageNumber ? { ...p, textStatus: 'regenerating' as const } : p
               );
               queryClient.setQueryData<Order>(['order', orderId], { ...previousOrder, storyPages: updatedPages });
           }
           return { previousOrder };
       },
       onSuccess: (newText, pageNumber) => {
           toast({ title: "Text Regenerated", description: `New text generated for page ${pageNumber}. Please review.` });
           // Update the query data directly with the new text after success, before invalidating
           const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
            if (previousOrder?.storyPages) {
                const updatedPages = previousOrder.storyPages.map(p =>
                    p.pageNumber === pageNumber ? { ...p, text: newText, textStatus: 'pending' as const } : p
                );
                queryClient.setQueryData<Order>(['order', orderId], { ...previousOrder, storyPages: updatedPages });
            } else {
                queryClient.invalidateQueries({ queryKey: ['order', orderId] }); // Invalidate if no previous order data
            }
       },
       onError: (err: Error, pageNumber, context) => {
           console.error(`Error regenerating text for page ${pageNumber}:`, err);
           toast({ variant: "destructive", title: "Text Regeneration Failed", description: err.message || "Could not regenerate page text." });
           if (context?.previousOrder) queryClient.setQueryData(['order', orderId], context.previousOrder);
           else queryClient.invalidateQueries({ queryKey: ['order', orderId] }); // Invalidate if no previous state
       },
       onSettled: (data, error, pageNumber) => {
          // Only invalidate if there was no direct update in onSuccess
          if (error || !data) {
              queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          }
       },
   });

    // --- PROMPT Mutations ---
    // Keep updateStoryPagePromptStatus mutation for internal use by regenerate prompt?
    // const updatePagePromptStatusMutation = useMutation({ ... }); // Potentially remove if not directly used by UI

   const regeneratePagePromptMutation = useMutation({
       mutationFn: (pageNumber: number) => {
           if (!orderId) throw new Error("Order ID is missing.");
           return regenerateStoryPagePrompt(orderId, pageNumber);
       },
       onMutate: async (pageNumber) => {
           await queryClient.cancelQueries({ queryKey: ['order', orderId] });
           const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
           if (previousOrder?.storyPages) {
               const updatedPages = previousOrder.storyPages.map(p =>
                   p.pageNumber === pageNumber ? { ...p, promptStatus: 'regenerating' as const } : p // Use promptStatus here
               );
               queryClient.setQueryData<Order>(['order', orderId], { ...previousOrder, storyPages: updatedPages });
           }
           return { previousOrder };
       },
       onSuccess: () => {
           toast({ title: "Prompt Regenerated", description: `New prompt generated. Please review.` });
       },
       onError: (err: Error, pageNumber, context) => {
           console.error(`Error regenerating prompt for page ${pageNumber}:`, err);
           toast({ variant: "destructive", title: "Prompt Regeneration Failed", description: err.message || "Could not regenerate page prompt." });
           if (context?.previousOrder) queryClient.setQueryData(['order', orderId], context.previousOrder);
       },
       onSettled: () => {
           queryClient.invalidateQueries({ queryKey: ['order', orderId] });
       },
   });

    // --- IMAGE Mutations ---
    const updatePageImageStatusMutation = useMutation({
        mutationFn: ({ pageNumber, newStatus }: { pageNumber: number, newStatus: PageItemStatus }) => {
            if (!orderId) throw new Error("Order ID is missing.");
            return updateStoryPageImageStatus(orderId, pageNumber, newStatus);
        },
        onSuccess: (_, variables) => {
            toast({ title: "Image Status Updated", description: `Page ${variables.pageNumber} image status set to ${pageItemStatusStyles[variables.newStatus].label}.` });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate list if stage might change
        },
        onError: (err: Error, variables) => {
            console.error(`Error updating image status for page ${variables.pageNumber}:`, err);
            toast({ variant: "destructive", title: "Image Update Failed", description: err.message || "Could not update page image status." });
        },
    });
    // Mutation to *trigger* MidJourney generation (replaces regenerateStoryPageImage)
    const generateImageMutation = useMutation({
        mutationFn: (pageNumber: number) => {
            if (!orderId) throw new Error("Order ID is missing.");
            return generateMidJourneyImage(orderId, pageNumber);
        },
        onMutate: async (pageNumber) => {
            await queryClient.cancelQueries({ queryKey: ['order', orderId] });
            const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
            if (previousOrder?.storyPages) {
                const updatedPages = previousOrder.storyPages.map(p =>
                    p.pageNumber === pageNumber ? {
                         ...p,
                         imageStatus: 'regenerating' as const,
                         compositeImageUrl: undefined, // Clear old composite
                         illustrationImageUrl: undefined // Clear old final image
                     } : p
                );
                queryClient.setQueryData<Order>(['order', orderId], { ...previousOrder, storyPages: updatedPages });
            }
            return { previousOrder };
        },
        onSuccess: (_, pageNumber) => {
            toast({ title: "Image Generation Started", description: `Generating images for page ${pageNumber}. Please wait... (Mock)` });
            // Invalidate after a delay to simulate webhook completion
            setTimeout(() => {
                 queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            }, 6000); // ~5s webhook delay + buffer
        },
        onError: (err: Error, pageNumber, context) => {
            console.error(`Error generating image for page ${pageNumber}:`, err);
            const message = err instanceof AxiosError ? err.response?.data?.message || err.message : err.message;
            toast({ variant: "destructive", title: "Image Generation Failed", description: message || "Could not start image generation." });
            if (context?.previousOrder) queryClient.setQueryData(['order', orderId], context.previousOrder);
            else queryClient.invalidateQueries({ queryKey: ['order', orderId] }); // Invalidate if no previous state
        },
        // No onSettled here, onSuccess handles invalidation after delay
    });

    // Mutation to select a quadrant from the composite image
    const selectQuadrantMutation = useMutation({
        mutationFn: ({ pageNumber, quadrantIndex }: { pageNumber: number, quadrantIndex: number }) => {
            if (!orderId) throw new Error("Order ID is missing.");
            return selectMidJourneyImageQuadrant(orderId, pageNumber, quadrantIndex);
        },
        onSuccess: (_, variables) => {
            toast({ title: "Image Selected", description: `Quadrant ${variables.quadrantIndex + 1} selected for page ${variables.pageNumber}. Please review and accept.` });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        },
        onError: (err: Error, variables) => {
            console.error(`Error selecting quadrant for page ${variables.pageNumber}:`, err);
            toast({ variant: "destructive", title: "Selection Failed", description: err.message || "Could not select image quadrant." });
        },
    });


   // --- FINAL REVIEW Mutations ---

   const approveFinalStoryMutation = useMutation({
       mutationFn: () => {
           if (!orderId) throw new Error("Order ID is missing.");
           return approveFinalStory(orderId);
       },
       onSuccess: () => {
           toast({ title: "Story Approved", description: `Order ${orderId} is ready for delivery.` });
           queryClient.invalidateQueries({ queryKey: ['order', orderId] });
           queryClient.invalidateQueries({ queryKey: ['orders'] });
       },
       onError: (err: Error) => {
           console.error(`Error approving final story for order ${orderId}:`, err);
           toast({ variant: "destructive", title: "Approval Failed", description: err.message || "Could not approve the final story." });
       },
   });

   const requestCorrectionMutation = useMutation({
       mutationFn: (targetStage?: OrderStage) => { // Allow optional target stage
           if (!orderId) throw new Error("Order ID is missing.");
           return requestCorrection(orderId, targetStage);
       },
       onSuccess: (_, targetStage) => {
           toast({ title: "Correction Requested", description: `Order ${orderId} requires correction. ${targetStage ? `Moved back to ${stageStyles[targetStage]?.label || targetStage}.` : ''}` });
           queryClient.invalidateQueries({ queryKey: ['order', orderId] });
           queryClient.invalidateQueries({ queryKey: ['orders'] });
       },
       onError: (err: Error) => {
           console.error(`Error requesting correction for order ${orderId}:`, err);
           toast({ variant: "destructive", title: "Correction Request Failed", description: err.message || "Could not request correction." });
       },
   });

    // --- DELIVERY Mutation ---
    const deliverOrderMutation = useMutation({
        mutationFn: (method: 'email' | string = 'email') => {
            if (!orderId) throw new Error("Order ID is missing.");
            return deliverOrder(orderId, method);
        },
        onSuccess: (_, method) => {
            toast({ title: "Order Delivered", description: `Order ${orderId} has been marked as delivered via ${method}.` });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (err: Error) => {
            console.error(`Error delivering order ${orderId}:`, err);
            toast({ variant: "destructive", title: "Delivery Failed", description: err.message || "Could not mark the order as delivered." });
        },
    });


  // --- HANDLERS ---

  const handleMarkAsCompleted = () => {
    console.log(`OrderDetailsPage: Initiating 'Force Complete' for MOCK ${orderId}`);
    // Force complete now means setting stage and status to 'completed' (ready for delivery)
    updateOrderMutation.mutate({ status: 'completed', stage: 'completed' });
  };

   // --- Character Sheet Handlers ---
   const handleGenerateCharacterSheet = (prompt: string) => {
     if (!order || !order.characterSheet) return;
     console.log(`Generating Character Sheet for order ${orderId}`);
     generateCharacterSheetMutation.mutate(prompt);
   };

   const handleAcceptCharacterSheet = () => {
     if (!order || !order.characterSheet || order.characterSheet.status !== 'pending' || !order.characterSheet.imageUrl) {
       toast({ variant: "destructive", title: "Cannot Accept", description: "Character sheet must be generated and pending review." });
       return;
     }
     console.log(`Accepting Character Sheet for order ${orderId}`);
     acceptCharacterSheetMutation.mutate();
   };


  const handleAcceptText = (pageNumber: number) => {
     console.log(`Accepting TEXT for page ${pageNumber} for order ${orderId}`);
     updatePageTextStatusMutation.mutate({ pageNumber, newStatus: 'accepted' });
  };
  const handleRegenerateText = (pageNumber: number) => {
       console.log(`Regenerating TEXT for page ${pageNumber} for order ${orderId}`);
       regeneratePageTextMutation.mutate(pageNumber);
  };
  // No longer need separate handler for accepting prompt
  // const handleAcceptPrompt = (pageNumber: number) => { ... };
  const handleRegeneratePrompt = (pageNumber: number) => {
       console.log(`Regenerating PROMPT for page ${pageNumber} for order ${orderId}`);
       regeneratePagePromptMutation.mutate(pageNumber);
  };
  // Handler to trigger image generation
  const handleGenerateImage = (pageNumber: number) => {
        console.log(`Generating IMAGE for page ${pageNumber} for order ${orderId}`);
        generateImageMutation.mutate(pageNumber);
   };
   // Handler to accept the final selected/uploaded image (and implicitly the prompt)
   const handleAcceptImage = (pageNumber: number) => {
        console.log(`Accepting FINAL IMAGE for page ${pageNumber} for order ${orderId}`);
        updatePageImageStatusMutation.mutate({ pageNumber, newStatus: 'accepted' });
   };
   // Handler to select a specific quadrant
   const handleSelectQuadrant = (pageNumber: number, quadrantIndex: number) => {
        console.log(`Selecting Quadrant ${quadrantIndex + 1} for page ${pageNumber}, order ${orderId}`);
        selectQuadrantMutation.mutate({ pageNumber, quadrantIndex });
   };
   // Handler for Re-roll (which is just triggering generation again)
   const handleRerollImage = (pageNumber: number) => {
        console.log(`Re-rolling IMAGE for page ${pageNumber} for order ${orderId}`);
        generateImageMutation.mutate(pageNumber); // Same mutation as initial generation
   };


  const handleCopyToClipboard = (text: string | undefined, type: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => {
                toast({ title: `${type} Copied`, description: `${type} copied to clipboard.` });
            })
            .catch(err => {
                console.error(`Failed to copy ${type}:`, err);
                toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy ${type}.` });
            });
    };

   // Handlers for Final Review Actions
   const handleApproveFinal = () => {
       console.log(`Approving final story for order ${orderId}`);
       approveFinalStoryMutation.mutate();
   };

   const handleRequestCorrection = () => {
       console.log(`Requesting correction for order ${orderId}`);
       // For now, just mark as needs correction. In a real app, you might prompt for details or target stage.
       // Default behavior: stays in 'final_review', status becomes 'needs_correction'
       requestCorrectionMutation.mutate();
       // Example: Move back to illustration review if correction needed there:
       // requestCorrectionMutation.mutate('visual_content_generation');
   };

   // Handler for Delivery Action
   const handleSendToCustomer = (method: 'email' | string = 'email') => {
        console.log(`Sending order ${orderId} to customer via ${method}`);
        deliverOrderMutation.mutate(method);
   };


  // --- RENDER STATES ---

  // Loading and Error states remain the same
  const renderLoading = () => (
     <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 flex items-start justify-center min-h-[calc(100vh-theme(spacing.24))]">
          <Card className="w-full max-w-3xl card">
              <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-y-3 md:gap-x-4 border-b pb-4">
                 <div className="flex-grow">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                 </div>
                 <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 items-start md:items-end shrink-0">
                     <Skeleton className="h-8 w-32 rounded-full" />
                     <Skeleton className="h-6 w-24 rounded-full" />
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 {/* Request Info Skeleton */}
                 <Card className="bg-muted/10 border shadow-inner">
                     <CardHeader>
                         <Skeleton className="h-6 w-1/3" />
                     </CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                         <Skeleton className="h-16 w-full" />
                     </CardContent>
                 </Card>
                  {/* Attachments Skeleton */}
                  <Card className="bg-muted/10 border shadow-inner">
                     <CardHeader>
                         <Skeleton className="h-6 w-1/4" />
                     </CardHeader>
                     <CardContent className="space-y-3">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                     </CardContent>
                 </Card>
                  {/* Review Section Skeleton */}
                  {renderLoadingSection("Review Section")}
                 {/* Action Bar Skeleton */}
                 <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t mt-6 space-y-3 sm:space-y-0">
                     <Skeleton className="h-10 w-32" />
                     <Skeleton className="h-10 w-40" />
                 </div>
              </CardContent>
          </Card>
      </div>
  );
  const renderError = (errorMessage: string = "An error occurred loading this order.") => (
     <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 flex items-start justify-center min-h-[calc(100vh-theme(spacing.24))]">
          <Card className="w-full max-w-3xl card">
              <CardHeader>
                 <CardTitle>Loading Failed</CardTitle>
              </CardHeader>
              <CardContent>
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                         {errorMessage} Please try again later or contact support.
                      </AlertDescription>
                  </Alert>
                   <div className="mt-6 flex justify-start">
                       <Button asChild variant="outline" className="btn">
                           <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
                       </Button>
                  </div>
              </CardContent>
          </Card>
      </div>
  );

   const renderLoadingSection = (title: string) => (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">{title}</CardTitle>
                <Skeleton className="h-4 w-3/4 mt-1" />
                <div className="pt-2 space-y-1">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-3 w-1/4 ml-auto" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
   );


  // --- Review Section Components ---

   // --- Character Sheet Review Section ---
   interface CharacterSheetReviewProps {
    title: string;
    description: string;
    characterSheet?: CharacterSheet;
    attachments?: Attachment[];
    orderId: string;
    isGenerating: boolean;
    isAccepting: boolean;
    onGenerate: (prompt: string) => void;
    onAccept: () => void;
    onPromptChange: (newPrompt: string) => void; // To update the prompt state held in the main component
    currentPrompt: string; // Pass the current prompt state down
   }

const CharacterSheetReviewSection: FC<CharacterSheetReviewProps> = ({
    title,
    description,
    characterSheet,
    attachments,
    orderId,
    isGenerating,
    isAccepting,
    onGenerate,
    onAccept,
    onPromptChange,
    currentPrompt,
}) => {
    const status = characterSheet?.status ?? 'pending';
    const statusConfig = characterSheetStatusStyles[status];
    const imageUrl = characterSheet?.imageUrl;
    const hasImage = !!imageUrl;
    const isAccepted = status === 'accepted';
    const photoAttachment = attachments?.find(att => att.name.match(/\.(jpg|jpeg|png|webp)$/i)); // Simple check for photo

    // Disable actions if accepted, generating, or accepting
    const isDisabled = isAccepted || isGenerating || isAccepting;
    const canAccept = hasImage && status === 'pending';

    // Handle prompt changes locally before passing up
    const handleLocalPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onPromptChange(e.target.value);
    };

    // Handle Generate button click
    const handleGenerateClick = () => {
        if (!currentPrompt || currentPrompt.trim() === '') {
            toast({ variant: "destructive", title: "Prompt Missing", description: "Please enter a prompt for the character sheet." });
            return;
        }
         if (!currentPrompt.includes('[UPLOADED_PHOTO_URL]') && !photoAttachment?.url) {
              toast({ variant: "destructive", title: "Photo Missing", description: "Please include a reference photo URL in the prompt or ensure one is attached." });
              // return; // Allow generation without photo for now, but warn
         }
         // Replace placeholder if photo exists
         const finalPrompt = photoAttachment?.url
            ? currentPrompt.replace('[UPLOADED_PHOTO_URL]', photoAttachment.url)
            : currentPrompt;

        onGenerate(finalPrompt);
    };


    return (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="pt-2 flex justify-end">
                    <Badge variant={statusConfig.variant} className="text-sm py-1 px-3 capitalize flex items-center w-fit">
                        {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : statusConfig.icon}
                        {isGenerating ? 'Generating...' : statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Uploaded Photo Preview (Optional) */}
                 {photoAttachment && (
                     <div className="space-y-2">
                         <Label className="text-sm font-medium">Reference Photo</Label>
                          <div className="relative aspect-square w-32 h-32 overflow-hidden rounded-md border bg-background">
                              <Image
                                  src={photoAttachment.url}
                                  alt={photoAttachment.name}
                                  fill
                                  sizes="128px"
                                  style={{ objectFit: 'cover' }}
                                  unoptimized={photoAttachment.url === "#"} // Only optimize if not placeholder
                                  data-ai-hint="child portrait"
                              />
                          </div>
                     </div>
                 )}
                  {!photoAttachment && (
                      <Alert variant="default" className="bg-background/50">
                          <Info className="h-4 w-4" />
                          <AlertTitle>No Reference Photo</AlertTitle>
                          <AlertDescription>
                            No photo attachment found. Generation will proceed without a `--cref` parameter unless a URL is included in the prompt.
                          </AlertDescription>
                      </Alert>
                  )}


                 {/* Prompt Editor */}
                 <div className="space-y-2">
                    <Label htmlFor={`cs-prompt-${orderId}`} className="text-sm font-medium">MidJourney Prompt</Label>
                    <Textarea
                        id={`cs-prompt-${orderId}`}
                        value={currentPrompt}
                        onChange={handleLocalPromptChange}
                        placeholder="Enter the prompt for the character sheet..."
                        className={cn("h-40 font-mono bg-background text-sm", isAccepted && "opacity-70")}
                        readOnly={isDisabled && !isGenerating} // Allow editing unless accepted
                    />
                 </div>

                 {/* Image Preview Area */}
                 <div className="p-2 border rounded-md bg-background min-h-[200px] flex items-center justify-center">
                     {isGenerating && (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Generating Character Sheet...</p>
                             <p className="text-xs">(This takes ~1-2 mins, mock delay is shorter)</p>
                        </div>
                     )}
                    {!isGenerating && hasImage && (
                         <div className="relative aspect-square w-full max-w-[500px] mx-auto overflow-hidden rounded-md border bg-muted/50 group">
                             <Dialog>
                                 <DialogTrigger asChild>
                                     <button className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none" aria-label="View larger character sheet">
                                         <Maximize className="h-8 w-8 text-white" />
                                     </button>
                                 </DialogTrigger>
                                 <Image
                                     src={imageUrl}
                                     alt={`Generated Character Sheet for order ${orderId}`}
                                     fill
                                     sizes="(max-width: 768px) 100vw, 500px"
                                     style={{ objectFit: 'contain' }}
                                     className={cn("transition-opacity", isAccepted && "opacity-70")}
                                     unoptimized // Assuming external MJ links
                                 />
                                  <DialogContent className="max-w-4xl p-2">
                                     <DialogHeader className="sr-only">
                                         <DialogTitle>Character Sheet Preview - Order {orderId}</DialogTitle>
                                     </DialogHeader>
                                     <div className="relative aspect-square"> {/* Aspect ratio for character sheet */}
                                         <Image
                                             src={imageUrl}
                                             alt={`Character Sheet - Large View`}
                                             fill
                                             sizes="100vw"
                                             style={{ objectFit: 'contain' }}
                                             unoptimized
                                         />
                                     </div>
                                 </DialogContent>
                             </Dialog>
                         </div>
                     )}
                    {!isGenerating && !hasImage && (
                         <div className="text-center text-muted-foreground">
                             <ImageIconLucide className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                             <p>Character sheet not generated yet.</p>
                             <p className="text-xs mt-1">Edit the prompt and click 'Generate'.</p>
                         </div>
                     )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 items-center pt-4 border-t">
                     <Button
                         variant="outline"
                         size="sm"
                         onClick={handleGenerateClick} // Use dedicated handler
                         disabled={isDisabled}
                         className="btn w-full sm:w-auto"
                         aria-label="Generate or Regenerate Character Sheet"
                     >
                         {isGenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4"/>}
                         {isGenerating ? 'Generating...' : (hasImage ? 'Regenerate' : 'Generate')}
                     </Button>
                     <Button
                         variant="default"
                         size="sm"
                         onClick={onAccept}
                         disabled={!canAccept || isDisabled}
                         className={cn("btn w-full sm:w-auto", isAccepted ? "bg-green-600 hover:bg-green-700" : "bg-primary")}
                         aria-label="Accept Character Sheet"
                     >
                         {isAccepting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4"/>}
                         {isAccepted ? 'Accepted' : (isAccepting ? 'Accepting...' : 'Accept Character Sheet')}
                     </Button>
                 </div>
             </CardContent>
         </Card>
     );
 };



  // Base ReviewSection component for Text items
  interface TextReviewItemProps {
    title: string;
    description: string;
    pages: StoryPage[];
    orderId: string;
    isLoadingRegenerate: boolean;
    isAccepting: boolean;
    regeneratingPageNumber: number | null;
    onAccept: (pageNumber: number) => void;
    onRegenerate: (pageNumber: number) => void;
  }

const TextReviewItemSection: FC<TextReviewItemProps> = ({
    title,
    description,
    pages,
    orderId,
    isLoadingRegenerate,
    isAccepting,
    regeneratingPageNumber,
    onAccept,
    onRegenerate,
}) => {
    const totalPages = pages.length;
    const itemType = 'text';

    const acceptedPages = pages.filter(p => p.textStatus === 'accepted').length;
    const progressPercentage = totalPages > 0 ? (acceptedPages / totalPages) * 100 : 0;

    return (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="pt-2 space-y-1">
                    <Progress value={progressPercentage} aria-label={`${acceptedPages} of ${totalPages} items accepted`} />
                    <p className="text-xs text-muted-foreground text-right">{acceptedPages} / {totalPages} Items Accepted</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {pages.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full" defaultValue={pages.find(p => p.textStatus === 'pending') ? `item-${itemType}-${pages.find(p => p.textStatus === 'pending')?.pageNumber}` : (pages.length > 0 ? `item-${itemType}-${pages[0].pageNumber}` : undefined)}>
                        {pages
                            .sort((a, b) => a.pageNumber - b.pageNumber)
                            .map((page) => {
                                const currentStatus = page.textStatus;
                                const statusConfig = pageItemStatusStyles[currentStatus ?? 'pending'] || pageItemStatusStyles.pending;
                                const content = page.text;
                                const isCurrentPageRegenerating = regeneratingPageNumber === page.pageNumber;
                                const isAccepted = currentStatus === 'accepted';
                                // Disable actions if the page is accepted, any text action is loading, or this specific page is regenerating
                                const isRegenerateDisabled = isAccepted || isLoadingRegenerate || isAccepting || isCurrentPageRegenerating;
                                const isAcceptDisabled = isAccepted || isLoadingRegenerate || isAccepting || isCurrentPageRegenerating || !content; // Also disable accept if content is empty

                                const itemTitle = 'Generated Text';
                                const ariaLabelPrefix = 'Story text';

                                return (
                                    <AccordionItem value={`item-${itemType}-${page.pageNumber}`} key={`${itemType}-${page.pageNumber}`}>
                                        <AccordionTrigger className="text-base hover:no-underline px-2">
                                            Page {page.pageNumber} - {itemTitle} - {statusConfig.label}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-1">
                                            <Card className={cn("bg-card border shadow-sm transition-opacity", isAccepted && "opacity-70")}>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-sm font-medium">{itemTitle}</CardTitle>
                                                    <Badge variant={statusConfig.variant} className="text-xs py-0.5 px-2 capitalize flex items-center">
                                                        {isCurrentPageRegenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : statusConfig.icon}
                                                        {isCurrentPageRegenerating ? 'Generating...' : statusConfig.label}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {content ? (
                                                        <Textarea
                                                            readOnly
                                                            value={content}
                                                            className="h-32 text-sm bg-muted/30 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 border-muted"
                                                            aria-label={`${ariaLabelPrefix} for page ${page.pageNumber}`}
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-center text-muted-foreground italic py-4">(No text available yet for this page)</p>
                                                    )}
                                                    <div className="flex justify-end space-x-2 items-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onRegenerate(page.pageNumber)}
                                                            disabled={isRegenerateDisabled} // Regenerate is enabled even if text is empty, unless already accepted/loading
                                                            className="btn text-accent hover:bg-accent/10"
                                                            aria-label={`Regenerate text for page ${page.pageNumber}`}
                                                        >
                                                            {isCurrentPageRegenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4"/>}
                                                            {isCurrentPageRegenerating ? 'Generating...' : 'Regenerate'}
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => onAccept(page.pageNumber)}
                                                            disabled={isAcceptDisabled} // Accept is disabled if text is empty or already accepted/loading
                                                            className={cn("btn w-24", isAccepted ? "bg-green-600 hover:bg-green-700" : "bg-primary")}
                                                            aria-label={`Accept text for page ${page.pageNumber}`}
                                                        >
                                                            {isAccepting && !isCurrentPageRegenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : (isAccepted ? <Check className="mr-1 h-4 w-4" /> : <Check className="mr-1 h-4 w-4"/>)}
                                                            {isAccepted ? 'Accepted' : 'Accept'}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                    </Accordion>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">(No story pages available for this order)</p>
                )}
            </CardContent>
        </Card>
    );
};


// --- Combined Visual Content Review Section (Prompts & Images) ---
interface VisualContentReviewProps {
    title: string;
    description: string;
    pages: StoryPage[];
    orderId: string;
    // Prompt Mutations (Only Regenerate)
    isRegeneratingPrompt: boolean;
    regeneratingPromptPageNumber: number | null;
    onRegeneratePrompt: (pageNumber: number) => void;
    onCopyPrompt: (text: string | undefined, type: string) => void;
    // Image Mutations
    isGeneratingImage: boolean;
    isSelectingQuadrant: boolean;
    isAcceptingImage: boolean;
    generatingImagePageNumber: number | null;
    onGenerateImage: (pageNumber: number) => void;
    onSelectQuadrant: (pageNumber: number, quadrantIndex: number) => void;
    onRerollImage: (pageNumber: number) => void;
    onAcceptImage: (pageNumber: number) => void; // This button now accepts BOTH prompt & image for the page
}

const VisualContentReviewSection: FC<VisualContentReviewProps> = ({
    title,
    description,
    pages,
    orderId,
    // Prompt Props
    isRegeneratingPrompt,
    regeneratingPromptPageNumber,
    onRegeneratePrompt,
    onCopyPrompt,
    // Image Props
    isGeneratingImage,
    isSelectingQuadrant,
    isAcceptingImage,
    generatingImagePageNumber,
    onGenerateImage,
    onSelectQuadrant,
    onRerollImage,
    onAcceptImage,
}) => {
    const totalPages = pages.length;

    // Progress Calculation: Based on accepted IMAGES (since accepting the image is the final step for this stage)
    const acceptedImages = pages.filter(p => p.imageStatus === 'accepted' && !!p.illustrationImageUrl).length;
    const progressPercentage = totalPages > 0 ? (acceptedImages / totalPages) * 100 : 0;

    // Helper to check if all *texts* are accepted for the order (needed to enable image generation)
    // NOTE: This check might be redundant if the stage logic already guarantees text is accepted, but keep for safety.
    const allTextsAccepted = pages.every(p => p.textStatus === 'accepted');


    return (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="pt-2 space-y-1">
                    <Progress value={progressPercentage} aria-label={`${acceptedImages} of ${totalPages} pages visually complete`} />
                    <p className="text-xs text-muted-foreground text-right">
                         {acceptedImages} / {totalPages} Pages Visually Accepted
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {pages.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full" defaultValue={pages.find(p => (p.promptStatus !== 'accepted' || p.imageStatus !== 'accepted')) ? `item-visual-${pages.find(p => (p.promptStatus !== 'accepted' || p.imageStatus !== 'accepted'))?.pageNumber}` : (pages.length > 0 ? `item-visual-${pages[0].pageNumber}` : undefined)}>
                        {pages
                            .sort((a, b) => a.pageNumber - b.pageNumber)
                            .map((page) => {
                                // Prompt related states (mostly for display and regenerate)
                                const promptStatus = page.promptStatus ?? 'pending'; // Treat undefined as pending review
                                const promptStatusConfig = pageItemStatusStyles[promptStatus];
                                const promptContent = page.midjourneyPrompt;
                                const isCurrentPageRegeneratingPrompt = regeneratingPromptPageNumber === page.pageNumber;
                                // isPromptAccepted is no longer a separate blocking state for UI, but used internally for image gen logic
                                const isPromptAccepted = promptStatus === 'accepted';
                                // Prompt actions enabled if not currently regenerating/generating image/accepting image/selecting quadrant
                                const promptActionDisabled = isRegeneratingPrompt || isCurrentPageRegeneratingPrompt || isGeneratingImage || isAcceptingImage || isSelectingQuadrant;

                                // Image related states
                                const imageStatus = page.imageStatus ?? 'pending'; // Default image status if prompt is accepted
                                const imageStatusConfig = pageItemStatusStyles[imageStatus];
                                const isCurrentPageGeneratingImage = generatingImagePageNumber === page.pageNumber;
                                const isImageAccepted = imageStatus === 'accepted' && !!page.illustrationImageUrl;
                                const hasCompositeImage = !!page.compositeImageUrl;
                                const hasFinalImage = !!page.illustrationImageUrl;

                                // Determine overall disable state for visual actions (accept/generate/reroll/select)
                                const isVisualActionDisabled = isImageAccepted || isGeneratingImage || isAcceptingImage || isSelectingQuadrant || isCurrentPageGeneratingImage || isRegeneratingPrompt;

                                // Determine button visibility/enablement
                                const canGenerateImage = allTextsAccepted && !!promptContent && !isVisualActionDisabled && !hasCompositeImage && !hasFinalImage;
                                const canSelectQuadrant = allTextsAccepted && !!promptContent && !isVisualActionDisabled && hasCompositeImage && !hasFinalImage;
                                const canAcceptFinalImage = allTextsAccepted && !!promptContent && !isVisualActionDisabled && hasFinalImage && imageStatus === 'pending'; // Only allow accept if pending
                                const canRerollImage = allTextsAccepted && !!promptContent && !isVisualActionDisabled && (hasCompositeImage || hasFinalImage);


                                let pageStateLabel = "Prompt Review"; // Initial default
                                if (isCurrentPageRegeneratingPrompt) {
                                    pageStateLabel = "Prompt Generating...";
                                } else if (isCurrentPageGeneratingImage) {
                                    pageStateLabel = "Image Generating...";
                                } else if (hasCompositeImage) {
                                    pageStateLabel = "Select Quadrant";
                                } else if (hasFinalImage && imageStatus === 'pending') {
                                    pageStateLabel = "Accept Final Image";
                                } else if (isImageAccepted) {
                                    pageStateLabel = "Visuals Accepted";
                                } else if (allTextsAccepted && !!promptContent) {
                                     pageStateLabel = "Ready to Generate Image";
                                } else if (allTextsAccepted && !promptContent) {
                                    pageStateLabel = "Prompt Missing";
                                }

                                const displayImageUrl = page.illustrationImageUrl || page.compositeImageUrl;

                                return (
                                    <AccordionItem value={`item-visual-${page.pageNumber}`} key={`visual-${page.pageNumber}`}>
                                        <AccordionTrigger className="text-base hover:no-underline px-2">
                                            Page {page.pageNumber} - Visuals - {pageStateLabel}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-1 space-y-4">
                                            {/* --- Prompt Review Section --- */}
                                            <Card className={cn("bg-card/80 border border-dashed shadow-sm transition-opacity", isImageAccepted && "opacity-70 border-solid")}>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-sm font-medium">MidJourney Prompt</CardTitle>
                                                    {/* Badge shows prompt status, but doesn't block image actions if prompt exists */}
                                                     <Badge variant={isCurrentPageRegeneratingPrompt ? 'default' : (promptContent ? 'outline' : 'secondary')} className="text-xs py-0.5 px-2 capitalize flex items-center">
                                                        {isCurrentPageRegeneratingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : (promptContent ? <Check className="mr-1 h-3 w-3 text-green-600" /> : <Info className="mr-1 h-3 w-3" />)}
                                                        {isCurrentPageRegeneratingPrompt ? 'Generating...' : (promptContent ? 'Ready' : 'Missing')}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {promptContent ? (
                                                        <Textarea
                                                            readOnly
                                                            value={promptContent}
                                                            className="h-24 text-sm bg-muted/30 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 border-muted font-mono"
                                                            aria-label={`MidJourney prompt for page ${page.pageNumber}`}
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-center text-muted-foreground italic py-4">(No prompt generated yet)</p>
                                                    )}
                                                    <div className="flex justify-end space-x-2 items-center">
                                                        {promptContent && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => onCopyPrompt(promptContent, 'Prompt')}
                                                                disabled={!promptContent} // Enable copy if prompt exists
                                                                className="btn text-muted-foreground hover:bg-muted/20"
                                                                aria-label={`Copy prompt for page ${page.pageNumber}`}
                                                            >
                                                                <Copy className="mr-1 h-4 w-4"/> Copy
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onRegeneratePrompt(page.pageNumber)}
                                                            disabled={promptActionDisabled || isImageAccepted} // Disable if any process running or image already accepted
                                                            className="btn text-accent hover:bg-accent/10"
                                                            aria-label={`Regenerate prompt for page ${page.pageNumber}`}
                                                        >
                                                            {isCurrentPageRegeneratingPrompt ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4"/>}
                                                            {isCurrentPageRegeneratingPrompt ? 'Generating...' : 'Regenerate'}
                                                        </Button>
                                                        {/* Removed Accept Prompt Button */}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* --- Illustration Review Section (Now always visible if text accepted) --- */}
                                            {allTextsAccepted && (
                                                <Card className={cn("bg-card border shadow-sm transition-opacity", isImageAccepted && "opacity-70")}>
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <CardTitle className="text-sm font-medium">Illustration</CardTitle>
                                                         <Badge variant={isCurrentPageGeneratingImage ? 'default' : imageStatusConfig.variant} className="text-xs py-0.5 px-2 capitalize flex items-center">
                                                            {isCurrentPageGeneratingImage ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : imageStatusConfig.icon}
                                                            {isCurrentPageGeneratingImage ? "Generating..." : (hasCompositeImage ? "Select Quadrant" : (hasFinalImage && imageStatus === 'pending' ? "Pending Final Accept" : (hasFinalImage && imageStatus === 'accepted' ? "Accepted" : "Ready to Generate")))}
                                                        </Badge>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        {/* Display Area: Initial Prompt, Composite Grid, or Final Image */}
                                                        <div className="p-2 border rounded-md bg-muted/30 min-h-[150px] flex items-center justify-center">
                                                            {isCurrentPageGeneratingImage && (
                                                                <div className="text-center text-muted-foreground">
                                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                                                    <p>Generating image via MidJourney...</p>
                                                                    <p className="text-xs">(This takes ~1-2 mins, mock delay is shorter)</p>
                                                                </div>
                                                            )}
                                                            {!isCurrentPageGeneratingImage && hasCompositeImage && !hasFinalImage && (
                                                                // Display Composite Image Grid for Selection
                                                                <div className="grid grid-cols-2 gap-2 w-full aspect-square max-w-[400px] mx-auto">
                                                                    {[0, 1, 2, 3].map((index) => (
                                                                        <button
                                                                            key={index}
                                                                            onClick={() => !isVisualActionDisabled && onSelectQuadrant(page.pageNumber, index)}
                                                                            disabled={isVisualActionDisabled || isSelectingQuadrant}
                                                                            className={cn(
                                                                                "relative aspect-square overflow-hidden rounded-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:border-primary transition-colors group",
                                                                                (isSelectingQuadrant || isVisualActionDisabled) && "cursor-not-allowed opacity-50"
                                                                            )}
                                                                            aria-label={`Select image quadrant ${index + 1}`}
                                                                        >
                                                                            <Image
                                                                                src={page.compositeImageUrl!}
                                                                                alt={`Composite image quadrant ${index + 1} for page ${page.pageNumber}`}
                                                                                fill
                                                                                sizes="(max-width: 768px) 50vw, 200px"
                                                                                className={cn(
                                                                                    "object-cover transition-transform duration-300 group-hover:scale-105",
                                                                                    index === 0 && "object-left-top", index === 1 && "object-right-top", index === 2 && "object-left-bottom", index === 3 && "object-right-bottom"
                                                                                )}
                                                                                unoptimized // Assuming external MJ links
                                                                                data-ai-hint="fantasy art"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <CheckCircle className="w-8 h-8 text-white" />
                                                                            </div>
                                                                            {isSelectingQuadrant && selectQuadrantMutation.variables?.pageNumber === page.pageNumber && selectQuadrantMutation.variables?.quadrantIndex === index && (
                                                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                                                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {!isCurrentPageGeneratingImage && hasFinalImage && (
                                                                // Display Final Selected Image
                                                                <div className="relative aspect-video w-full max-w-[500px] mx-auto overflow-hidden rounded-md border bg-muted/50 group">
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <button className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none" aria-label={`View larger image for page ${page.pageNumber}`}>
                                                                                <Maximize className="h-8 w-8 text-white" />
                                                                            </button>
                                                                        </DialogTrigger>
                                                                         <Image
                                                                            src={page.illustrationImageUrl!}
                                                                            alt={`Final illustration for page ${page.pageNumber}`}
                                                                            fill
                                                                            sizes="(max-width: 768px) 90vw, 500px" // Adjusted sizes
                                                                            style={{ objectFit: 'contain' }}
                                                                            className="transition-transform duration-300 group-hover:scale-105"
                                                                            unoptimized
                                                                             data-ai-hint="fantasy art"
                                                                        />
                                                                         <DialogContent className="max-w-4xl p-2">
                                                                            <DialogHeader className="sr-only">
                                                                                <DialogTitle>Illustration Preview - Page {page.pageNumber}</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="relative aspect-video">
                                                                                <Image
                                                                                    src={page.illustrationImageUrl!}
                                                                                    alt={`Illustration for page ${page.pageNumber} - Large View`}
                                                                                    fill
                                                                                    sizes="100vw"
                                                                                    style={{ objectFit: 'contain' }}
                                                                                    unoptimized
                                                                                     data-ai-hint="fantasy art large"
                                                                                />
                                                                            </div>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            )}
                                                            {!isCurrentPageGeneratingImage && !hasCompositeImage && !hasFinalImage && (
                                                                // Initial state for image gen
                                                                <div className="text-center text-muted-foreground">
                                                                    <ImageIconLucide className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                                                                    <p>Image not generated yet.</p>
                                                                    {!promptContent ? (
                                                                         <p className="text-xs mt-1 text-destructive">Generate or provide a prompt first.</p>
                                                                    ) : (
                                                                        <p className="text-xs mt-1">Click 'Generate Image' to start.</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Image Action Buttons */}
                                                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 items-center pt-4 border-t">
                                                            {canGenerateImage && (
                                                                <Button variant="outline" size="sm" onClick={() => onGenerateImage(page.pageNumber)} disabled={isVisualActionDisabled} className="btn w-full sm:w-auto" aria-label={`Generate image for page ${page.pageNumber}`}>
                                                                    <Sparkles className="mr-1 h-4 w-4" /> Generate Image
                                                                </Button>
                                                            )}
                                                            {canRerollImage && (
                                                                <Button variant="secondary" size="sm" onClick={() => onRerollImage(page.pageNumber)} disabled={isVisualActionDisabled} className="btn w-full sm:w-auto" aria-label={`Re-roll image generation for page ${page.pageNumber}`}>
                                                                    <RefreshCw className="mr-1 h-4 w-4" /> Re-roll
                                                                </Button>
                                                            )}
                                                            {canAcceptFinalImage && (
                                                                <Button variant="default" size="sm" onClick={() => onAcceptImage(page.pageNumber)} disabled={isVisualActionDisabled} className={cn("btn w-full sm:w-auto", isImageAccepted ? "bg-green-600 hover:bg-green-700" : "bg-primary")} aria-label={`Accept final image for page ${page.pageNumber}`}>
                                                                    {isAcceptingImage ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4"/>}
                                                                    {isAcceptingImage ? 'Accepting...' : 'Accept Image'}
                                                                </Button>
                                                            )}
                                                            {isImageAccepted && (
                                                                <Button variant="default" size="sm" disabled={true} className="btn w-full sm:w-auto bg-green-600 hover:bg-green-700 cursor-not-allowed" aria-label="Image accepted">
                                                                    <Check className="mr-1 h-4 w-4" /> Accepted
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                             {!allTextsAccepted && (
                                                <p className="text-sm text-center text-muted-foreground italic py-4">(Accept all story text pages first to enable visual content generation)</p>
                                             )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                    </Accordion>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">(No story pages available for this order)</p>
                )}
            </CardContent>
        </Card>
    );
};


  // --- Final Review Section Component ---
  interface FinalReviewSectionProps {
    orderId: string;
    finalStory?: FinalStory; // Final story data
    isLoading: boolean; // General mutation loading state
    isApproving: boolean;
    isRequestingCorrection: boolean;
    onApprove: () => void;
    onRequestCorrection: () => void; // Simple version for now
  }

const FinalReviewSection: FC<FinalReviewSectionProps> = ({
    orderId,
    finalStory,
    isLoading,
    isApproving,
    isRequestingCorrection,
    onApprove,
    onRequestCorrection,
}) => {
    const status = finalStory?.assemblyStatus ?? 'pending'; // Default to pending if data missing
    const statusConfig = assemblyStatusStyles[status] || assemblyStatusStyles.pending;
    const pdfUrl = finalStory?.pdfUrl;
    const isDisabled = status === 'approved' || isLoading || isApproving || isRequestingCorrection;
    const canApprove = status === 'pending' || status === 'needs_correction';
    const canRequestCorrection = status === 'pending'; // Only allow correction if pending initial review

    return (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">Final Story Review</CardTitle>
                <CardDescription>Review the assembled storybook PDF and approve or request corrections.</CardDescription>
                <div className="pt-2 flex justify-end">
                     <Badge variant={statusConfig.variant} className="text-sm py-1 px-3 capitalize flex items-center w-fit">
                         {statusConfig.icon}
                         {statusConfig.label}
                     </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {pdfUrl && pdfUrl !== '#' ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-background rounded-md border gap-4">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0"/>
                             <span className="text-sm font-medium truncate" title="Final Storybook PDF">Final Storybook PDF</span>
                         </div>
                          <Button asChild variant="outline" size="sm" className="shrink-0 w-full sm:w-auto btn">
                             <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download={`storybook_${orderId}.pdf`}>
                                 <Eye className="mr-1 h-4 w-4"/> {/* Changed icon to Eye */}
                                 View PDF
                             </a>
                         </Button>
                    </div>
                 ) : (
                    <p className="text-sm text-center text-muted-foreground italic py-4">(Final story PDF is not yet available or assembly failed)</p>
                 )}

                 {/* Action Buttons */}
                 <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 items-center pt-4 border-t">
                     <Button
                        variant="destructive" // Use destructive style for correction
                        size="sm"
                        onClick={onRequestCorrection}
                        disabled={!canRequestCorrection || isDisabled}
                        className="btn w-full sm:w-auto"
                        aria-label="Request Correction"
                    >
                        {isRequestingCorrection ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <AlertOctagon className="mr-1 h-4 w-4"/>}
                        {isRequestingCorrection ? 'Sending...' : 'Request Correction'}
                    </Button>
                    <Button
                        variant="default" // Primary action to approve
                        size="sm"
                        onClick={onApprove}
                        disabled={!canApprove || isDisabled}
                        className={cn("btn w-full sm:w-auto", status === 'approved' ? "bg-green-600 hover:bg-green-700" : "bg-primary")}
                        aria-label="Approve Final Story"
                    >
                        {isApproving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4"/>}
                        {isApproving ? 'Approving...' : (status === 'approved' ? 'Approved' : 'Approve Final Story')}
                    </Button>
                </div>
                {status === 'needs_correction' && (
                    <Alert variant="destructive" className="mt-4">
                         <AlertTriangle className="h-4 w-4" />
                         <AlertTitle>Correction Requested</AlertTitle>
                         <AlertDescription>
                            This story requires corrections. Please review the feedback and address the issues. You may need to regenerate or update previous stages.
                         </AlertDescription>
                     </Alert>
                 )}
            </CardContent>
        </Card>
    );
};

  // --- Delivery Section Component ---
  interface DeliverySectionProps {
    orderId: string;
    customerEmail?: string;
    deliveryInfo?: DeliveryInfo;
    finalPdfUrl?: string;
    isLoading: boolean; // General mutation loading state
    isDelivering: boolean;
    onDeliver: (method?: 'email' | string) => void;
  }

const DeliverySection: FC<DeliverySectionProps> = ({
    orderId,
    customerEmail,
    deliveryInfo,
    finalPdfUrl,
    isLoading,
    isDelivering,
    onDeliver,
}) => {
    const isDelivered = !!deliveryInfo;
    const deliveredAt = isDelivered ? formatTimestamp(deliveryInfo.deliveredAt) : 'N/A';
    const deliveryMethod = deliveryInfo?.method || 'N/A';
    const downloadLink = deliveryInfo?.downloadLink || '#';

    // Determine if the 'Send' button should be enabled
    const canDeliver = !!finalPdfUrl && finalPdfUrl !== '#' && !!customerEmail && !isDelivered;

    return (
        <Card className="bg-muted/10 border shadow-inner">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground/90">Delivery Status</CardTitle>
                <CardDescription>Manage and view the delivery status of the final storybook.</CardDescription>
                 <div className="pt-2 flex justify-end">
                      {isDelivered ? (
                         <Badge variant="outline" className="text-sm py-1 px-3 capitalize flex items-center w-fit bg-primary/10 text-primary border-primary/30">
                             <PackageCheck className="mr-1 h-4 w-4" /> Delivered
                         </Badge>
                      ) : (
                          <Badge variant="secondary" className="text-sm py-1 px-3 capitalize flex items-center w-fit">
                              <Info className="mr-1 h-4 w-4" /> Awaiting Delivery
                          </Badge>
                      )}
                 </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                 {isDelivered ? (
                    <div className="space-y-2">
                         <p><strong>Delivery Method:</strong> <span className="text-muted-foreground">{deliveryMethod}</span></p>
                         <p><strong>Delivered At:</strong> <span className="text-muted-foreground">{deliveredAt}</span></p>
                         <p><strong>Customer Email:</strong> <span className="text-muted-foreground">{customerEmail || 'N/A'}</span></p>
                         {downloadLink !== '#' && (
                              <p><strong>Download Link Sent:</strong> <a href={downloadLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">{downloadLink}</a></p>
                         )}
                         <div className="flex justify-end pt-4 border-t">
                              <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => onDeliver(deliveryMethod || 'email')} // Allow resend using the same method
                                 disabled={isLoading || isDelivering || !customerEmail}
                                 className="btn w-full sm:w-auto"
                                 aria-label="Resend Storybook to Customer"
                              >
                                 {isDelivering ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                                 {isDelivering ? 'Resending...' : 'Resend Email'}
                              </Button>
                         </div>
                    </div>
                 ) : (
                     <div className="space-y-4">
                         <p className="text-muted-foreground italic text-center">The final storybook is ready to be sent to the customer.</p>
                         <p><strong>Customer Email:</strong> <span className="text-muted-foreground">{customerEmail || '(Email not available)'}</span></p>
                         <p><strong>Final PDF:</strong> {finalPdfUrl && finalPdfUrl !== '#' ? <a href={finalPdfUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">{finalPdfUrl}</a> : <span className="text-destructive">(Not available)</span>}</p>
                         <div className="flex justify-end pt-4 border-t">
                             <Button
                                 variant="default"
                                 size="sm"
                                 onClick={() => onDeliver('email')} // Default to email delivery
                                 disabled={!canDeliver || isLoading || isDelivering}
                                 className="btn w-full sm:w-auto"
                                 aria-label="Send Storybook to Customer"
                                 title={!canDeliver ? "Cannot deliver: Ensure final PDF is approved and customer email is present." : "Send storybook via email"}
                             >
                                 {isDelivering ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                                 {isDelivering ? 'Sending...' : 'Send Storybook to Customer'}
                             </Button>
                         </div>
                     </div>
                 )}
            </CardContent>
        </Card>
    );
};


  // --- Main Order Details Render Function ---
  const renderOrderDetails = (currentOrder: Order) => {
    // State and effects moved to the top level of OrderDetailsPage

    const statusConfig = statusStyles[currentOrder.status] || statusStyles.pending;
    const stageConfig = stageStyles[currentOrder.stage] || stageStyles.pending_approval;
    const { variant: statusVariant, icon: statusIcon, label: statusLabel } = statusConfig;
    const { variant: stageVariant, icon: stageIcon, label: stageLabel } = stageConfig;

    const createdAt = formatTimestamp(currentOrder.createdAt);
    const updatedAt = formatTimestamp(currentOrder.updatedAt);
    // Allow force complete unless delivered or failed
    const canMarkCompletedDirectly = !['delivered', 'failed', 'completed'].includes(currentOrder.stage);


    // Determine which review sections to show based on stage
    const storyPages = currentOrder.storyPages || [];
    const showCharacterSheetReview = currentOrder.stage === 'character_sheet_generation';
    const showStoryTextReview = currentOrder.stage === 'story_content_generation' && storyPages.length > 0;
    const showVisualContentReview = currentOrder.stage === 'visual_content_generation' && storyPages.length > 0;
    const showFinalReview = currentOrder.stage === 'final_review';
    const showDeliverySection = currentOrder.stage === 'completed' || currentOrder.stage === 'delivered';


    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 flex items-start justify-center min-h-[calc(100vh-theme(spacing.24))]">
        <Card className="w-full max-w-3xl card">
          {/* Header */}
          <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-y-3 md:gap-x-4 border-b pb-4">
            <div className="flex-grow">
              <CardTitle className="text-2xl font-semibold">Order Details</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">ID: {currentOrder.id}</CardDescription>
            </div>
             {/* Badges container */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 items-start md:items-end shrink-0">
                <Badge variant={stageVariant} className="text-sm py-1 px-3 capitalize flex items-center w-fit">
                    {stageIcon} Stage: {stageLabel}
                </Badge>
                 <Badge variant={statusVariant} className="text-xs py-0.5 px-2 capitalize flex items-center w-fit">
                    {statusIcon} Status: {statusLabel}
                 </Badge>
             </div>
          </CardHeader>

          {/* Content Sections */}
          <CardContent className="pt-6 space-y-6">

             {/* Request Information Card */}
             <Card className="bg-muted/10 border shadow-inner">
                 <CardHeader>
                    <CardTitle className="text-lg font-medium text-foreground/90">Request Information</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                         <div><strong>Customer:</strong> <span className="text-muted-foreground">{currentOrder.customerName}</span></div>
                         <div><strong>Email:</strong> <a href={`mailto:${currentOrder.email}`} className="text-accent hover:underline break-all"><Mail className="inline-block mr-1 h-4 w-4"/>{currentOrder.email}</a></div>
                         <div><strong>Story Type:</strong> <span className="text-muted-foreground">{currentOrder.storyType || 'N/A'}</span></div>
                         <div><strong>Language:</strong> <span className="text-muted-foreground">{currentOrder.language || 'N/A'}</span></div>
                         <div><strong>Created:</strong> <span className="text-muted-foreground">{createdAt}</span></div>
                         <div><strong>Last Updated:</strong> <span className="text-muted-foreground">{updatedAt}</span></div>
                     </div>
                      <div className="pt-2">
                         <strong className="block mb-1">Request Summary:</strong>
                         <p className="p-3 bg-background rounded-md border text-muted-foreground whitespace-pre-wrap">{currentOrder.orderSummary || 'No summary provided.'}</p>
                     </div>
                     {currentOrder.specialRequests && (
                        <div className="pt-2">
                            <strong className="block mb-1">Special Requests:</strong>
                            <p className="p-3 bg-background rounded-md border text-muted-foreground whitespace-pre-wrap">{currentOrder.specialRequests}</p>
                        </div>
                     )}
                 </CardContent>
             </Card>

             {/* Attachments Card */}
             {currentOrder.attachments && currentOrder.attachments.length > 0 && (
               <Card className="bg-muted/10 border shadow-inner">
                  <CardHeader>
                     <CardTitle className="text-lg font-medium text-foreground/90">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-2">
                         {currentOrder.attachments.map((att, index) => (
                              att && att.name && att.url ? (
                                 <li key={index} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                     <div className="flex items-center space-x-2 overflow-hidden">
                                         <Paperclip className="h-4 w-4 text-muted-foreground shrink-0"/>
                                         <span className="text-sm truncate" title={att.name}>{att.name}</span>
                                     </div>
                                     <Button asChild variant="ghost" size="sm" className="shrink-0" disabled={att.url === '#'}>
                                         <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.url !== '#' ? att.name : undefined}>
                                             <Download className="mr-1 h-4 w-4"/>
                                             {att.url === '#' ? 'N/A' : 'Download'}
                                         </a>
                                     </Button>
                                 </li>
                             ) : (
                                  <li key={index} className="p-2 text-sm text-destructive-foreground bg-destructive/80 rounded-md border border-destructive">
                                      Invalid attachment data (index {index}).
                                  </li>
                              )
                         ))}
                      </ul>
                  </CardContent>
               </Card>
             )}
             {(!currentOrder.attachments || currentOrder.attachments.length === 0) && (
                  <p className="text-sm text-center text-muted-foreground py-4">(No attachments provided)</p>
              )}

             {/* Character Sheet Review Section */}
             {showCharacterSheetReview && (
                 <CharacterSheetReviewSection
                     title="Character Sheet Generation"
                     description="Generate or review the character sheet based on uploaded photos and prompt."
                     characterSheet={currentOrder.characterSheet}
                     attachments={currentOrder.attachments}
                     orderId={currentOrder.id}
                     isGenerating={generateCharacterSheetMutation.isPending}
                     isAccepting={acceptCharacterSheetMutation.isPending}
                     onGenerate={handleGenerateCharacterSheet}
                     onAccept={handleAcceptCharacterSheet}
                     currentPrompt={characterSheetPrompt} // Pass current state
                     onPromptChange={setCharacterSheetPrompt} // Pass setter
                 />
             )}


            {/* Story Text Review Section */}
            {showStoryTextReview && (
                <TextReviewItemSection
                    title="Story Text Review"
                    description="Review and accept each page of the generated story text."
                    pages={storyPages}
                    orderId={currentOrder.id}
                    isLoadingRegenerate={regeneratePageTextMutation.isPending}
                    isAccepting={updatePageTextStatusMutation.isPending}
                    regeneratingPageNumber={regeneratePageTextMutation.isPending ? regeneratePageTextMutation.variables : null}
                    onAccept={handleAcceptText}
                    onRegenerate={handleRegenerateText}
                />
            )}

             {/* Combined Visual Content Review Section */}
             {showVisualContentReview && (
                <VisualContentReviewSection
                    title="Visual Content Review"
                    description="Review/regenerate prompts, then generate/select/accept images."
                    pages={storyPages}
                    orderId={currentOrder.id}
                    // Prompt Props
                    isRegeneratingPrompt={regeneratePagePromptMutation.isPending}
                    regeneratingPromptPageNumber={regeneratePagePromptMutation.isPending ? regeneratePagePromptMutation.variables : null}
                    onRegeneratePrompt={handleRegeneratePrompt}
                    onCopyPrompt={handleCopyToClipboard}
                    // Image Props
                    isGeneratingImage={generateImageMutation.isPending}
                    isSelectingQuadrant={selectQuadrantMutation.isPending}
                    isAcceptingImage={updatePageImageStatusMutation.isPending}
                    generatingImagePageNumber={generateImageMutation.isPending ? generateImageMutation.variables : null}
                    onGenerateImage={handleGenerateImage}
                    onSelectQuadrant={handleSelectQuadrant}
                    onRerollImage={handleRerollImage}
                    onAcceptImage={handleAcceptImage} // Accepts both prompt & image
                />
             )}


            {/* Final Review Section */}
            {showFinalReview && (
                 <FinalReviewSection
                    orderId={currentOrder.id}
                    finalStory={currentOrder.finalStory}
                    isLoading={updateOrderMutation.isPending} // General loading state
                    isApproving={approveFinalStoryMutation.isPending}
                    isRequestingCorrection={requestCorrectionMutation.isPending}
                    onApprove={handleApproveFinal}
                    onRequestCorrection={handleRequestCorrection}
                 />
            )}

            {/* Delivery Section */}
            {showDeliverySection && (
                 <DeliverySection
                    orderId={currentOrder.id}
                    customerEmail={currentOrder.email}
                    deliveryInfo={currentOrder.deliveryInfo}
                    finalPdfUrl={currentOrder.finalStory?.pdfUrl}
                    isLoading={updateOrderMutation.isPending}
                    isDelivering={deliverOrderMutation.isPending}
                    onDeliver={handleSendToCustomer}
                 />
            )}


            {/* Loading/Placeholder states for sections */}
             {currentOrder.stage === 'character_sheet_generation' && !showCharacterSheetReview && renderLoadingSection("Character Sheet Generation")}
            {currentOrder.stage === 'story_content_generation' && !showStoryTextReview && renderLoadingSection("Story Text Review")}
            {currentOrder.stage === 'visual_content_generation' && !showVisualContentReview && renderLoadingSection("Visual Content Review")}
            {currentOrder.stage === 'final_review' && !showFinalReview && renderLoadingSection("Final Story Review")}
             {currentOrder.stage === 'completed' && !showDeliverySection && renderLoadingSection("Delivery Status")}


             {/* Message indicating section completion or non-applicability */}
              {/* Updated messages reflecting stage changes */}
             {!showCharacterSheetReview && ['story_content_generation', 'visual_content_generation', 'final_review', 'completed', 'delivered'].includes(currentOrder.stage) && currentOrder.stage !== 'failed' && (
                  <p className="text-sm text-center text-muted-foreground py-4">(Character sheet generation completed)</p>
              )}
             {!showStoryTextReview && ['visual_content_generation', 'final_review', 'completed', 'delivered'].includes(currentOrder.stage) && currentOrder.stage !== 'failed' && (
                 <p className="text-sm text-center text-muted-foreground py-4">(Story text review completed)</p>
             )}
            {!showVisualContentReview && ['final_review', 'completed', 'delivered'].includes(currentOrder.stage) && currentOrder.stage !== 'failed' && (
                <p className="text-sm text-center text-muted-foreground py-4">(Visual content generation completed)</p>
            )}
             {!showFinalReview && ['completed', 'delivered'].includes(currentOrder.stage) && currentOrder.stage !== 'failed' && (
                 <p className="text-sm text-center text-muted-foreground py-4">(Final story review completed)</p>
             )}
              {/* Message if delivered */}
              {currentOrder.stage === 'delivered' && !showDeliverySection && (
                  <p className="text-sm text-center text-muted-foreground py-4">(Story has been delivered)</p>
              )}


            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t mt-6 space-y-3 sm:space-y-0">
               <Button asChild variant="outline" className="btn w-full sm:w-auto">
                 <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Link>
              </Button>
               {/* Keep the direct "Mark as Completed" button, but disable if delivered or failed */}
               {currentOrder.stage !== 'delivered' && currentOrder.stage !== 'failed' && ( // Hide force complete if delivered or failed
                   <Button
                     onClick={handleMarkAsCompleted}
                     disabled={!canMarkCompletedDirectly || updateOrderMutation.isPending}
                     className="btn w-full sm:w-auto"
                     aria-label={canMarkCompletedDirectly ? "Force Complete (Ready for Delivery)" : "Cannot force complete at this stage"}
                     variant="secondary" // Make it visually distinct from primary approve action
                     title={!canMarkCompletedDirectly ? "This action is disabled for the current stage. Use stage-specific actions." : "Manually mark this order as ready for delivery (use with caution)."}
                   >
                     {updateOrderMutation.isPending && updateOrderMutation.variables?.status === 'completed' ? (
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     ) : (
                       <XCircle className="mr-2 h-4 w-4" /> // Use a different icon
                     )}
                     {updateOrderMutation.isPending && updateOrderMutation.variables?.status === 'completed' ? 'Updating...' : 'Force Ready'}
                   </Button>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- MAIN RENDER LOGIC ---

  if (isLoading) {
       console.log(`OrderDetailsPage (MOCK ${orderId}): Rendering Loading state.`);
      return renderLoading();
  }

  if (isError) {
       console.error(`OrderDetailsPage (MOCK ${orderId}): Rendering Error state.`, error);
      return renderError(error?.message || undefined); // Pass specific error message
  }

  // Handle successful fetch but order is null (not found or invalid mapping)
  if (queryStatus === 'success' && !order) {
        console.log(`OrderDetailsPage (MOCK ${orderId}): Rendering Not Found state (query success, but order is null).`);
       return renderError(`Mock order with ID "${orderId}" was not found.`);
  }

  // Handle successful fetch with valid order data
  if (queryStatus === 'success' && order) {
       console.log(`OrderDetailsPage (MOCK ${orderId}): Rendering Order Details. Stage: ${order.stage}`);
      return renderOrderDetails(order);
  }

   // Fallback for unexpected states
   console.warn(`OrderDetailsPage (MOCK ${orderId}): Reached unexpected render state. Query Status: ${queryStatus}`);
   return renderError("An unexpected issue occurred while loading the mock order.");

};

// Wrap component with QueryClientProvider
const queryClientInstance = new QueryClient(); // Create ONE instance

const OrderDetailsPageWithProvider: FC = () => (
  <QueryClientProvider client={queryClientInstance}>
    <OrderDetailsPage />
  </QueryClientProvider>
);


export default OrderDetailsPageWithProvider;

    