
import type { Timestamp } from 'firebase/firestore';

// Add 'delivered' status
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'delivered';

// Add 'character_sheet_generation' stage
// Merged 'midjourney_prompt_generation' and 'visual_illustration_generation' into 'visual_content_generation'
// Added 'delivered' stage
export type OrderStage =
    | 'character_sheet_generation' // NEW: Stage for generating character reference
    | 'pending_approval' // Keep for now, maybe remove later if character sheet is always first
    | 'story_content_generation'
    | 'visual_content_generation' // Combined stage for prompt review and image generation/review
    | 'final_review' // Stage for final assembly review
    | 'completed' // Now means ready for delivery
    | 'failed'
    | 'delivered'; // Final stage after sending to customer

export interface Attachment {
  name: string;
  url: string;
}

// Updated Status types for different review items within a page
// Added states for image generation flow
export type PageItemStatus =
    | 'pending' // Default state, or waiting for review after generation/regeneration
    | 'accepted' // User accepted the item
    | 'regenerating'; // Item generation/regeneration is in progress

// Note: The visual_content_generation stage uses the 'pending' and 'regenerating' statuses
// for both prompts and images, along with the presence/absence of image URLs, to determine the UI state.

export interface StoryPage {
    pageNumber: number;
    text: string;
    textStatus: PageItemStatus;
    midjourneyPrompt?: string;
    promptStatus?: PageItemStatus; // Status for the prompt review step (kept for internal logic)
    illustrationImageUrl?: string; // Final selected/uploaded image URL
    compositeImageUrl?: string; // URL for the 2x2 MidJourney grid image (temporary)
    imageStatus?: PageItemStatus; // Status specifically for the image item review step
}

// Status for the final assembled story
export type AssemblyStatus = 'pending' | 'approved' | 'needs_correction';

// Structure for the final assembled story output
export interface FinalStory {
    pdfUrl?: string; // URL to the final PDF/output
    assemblyStatus: AssemblyStatus; // Status of the assembly
}

// Structure for delivery information
export interface DeliveryInfo {
    method: 'email' | 'manual' | string; // Allow custom methods but suggest common ones
    deliveredAt: Timestamp;
    downloadLink?: string; // Link sent to the customer
    // Add other relevant fields like tracking number if needed
}

// Status for the character sheet
export type CharacterSheetStatus = 'pending' | 'accepted'; // Simple status for now

// NEW: Structure for Character Sheet data
export interface CharacterSheet {
    imageUrl?: string; // URL of the generated character sheet image
    prompt: string; // The prompt used for generation
    status: CharacterSheetStatus; // Status of the character sheet review
}


export interface Order {
  id: string; // Document ID from Firestore
  customerName: string;
  email: string; // Added email field
  orderSummary: string; // Corresponds to "Story Title" or request summary
  status: OrderStatus; // Overall status
  stage: OrderStage; // Detailed stage of the order
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Add updatedAt
  storyType?: string; // Add storyType
  language?: string; // Add language
  specialRequests?: string; // Add specialRequests
  attachments?: Attachment[]; // Changed from fileUrl/fileName to match detail view
  characterSheet?: CharacterSheet; // NEW: Character sheet data
  storyPages?: StoryPage[]; // Array to hold story pages content and status
  finalStory?: FinalStory; // Optional field for final story assembly details
  deliveryInfo?: DeliveryInfo; // Optional field for delivery details
}

// Interface for the data stored in Firestore (without the ID)
// Ensure this matches the Order interface structure
export interface OrderData {
  customerName: string;
  email: string; // Added email field
  orderSummary: string;
  status: OrderStatus;
  stage: OrderStage; // Add stage here too
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Add updatedAt
  storyType?: string; // Add storyType
  language?: string; // Add language
  specialRequests?: string; // Add specialRequests
  attachments?: Attachment[]; // Changed from fileUrl/fileName
  characterSheet?: CharacterSheet; // NEW: Character sheet data
  storyPages?: StoryPage[]; // Add story pages here too
  finalStory?: FinalStory; // Add final story assembly details
  deliveryInfo?: DeliveryInfo; // Add delivery details here too
}

// Helper for mock timestamps - keep if needed by other parts, otherwise safe to remove
export interface MockTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}
