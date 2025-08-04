
import type { Order, OrderData, OrderStatus, Attachment, StoryPage, OrderStage, PageItemStatus, FinalStory, AssemblyStatus, DeliveryInfo, MockTimestamp, CharacterSheet, CharacterSheetStatus } from '@/types/order';
// Keep Timestamp for type compatibility, but our mock doesn't strictly need it
// import { Timestamp } from 'firebase/firestore'; // No longer needed as we create mock timestamps
import { AxiosError } from 'axios'; // Import AxiosError for type checking
import { generateStoryPageText, type GenerateStoryPageInput } from '@/ai/flows/generate-story-page-flow'; // Import the Genkit flow


// --- Mock Data ---

// Helper to create a mock Timestamp-like object (simplified, no actual Firestore dependency)
// Interface is now in types/order.ts
const createMockTimestamp = (date: Date): MockTimestamp => {
    return {
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: (date.getTime() % 1000) * 1000000,
        toDate: () => date,
        // Add other methods if needed by consumers, but keep simple for mock
    };
};

// Default Character Sheet Prompt Template
const DEFAULT_CHARACTER_SHEET_PROMPT = `A flat 2D character sheet of a 4-year-old boy named [CHILD_NAME] in a clean, modern illustration style. The character has [SKIN_TONE] skin, very soft slightly long [HAIR_COLOR] hair, wide [EYE_COLOR] eyes with long eyelashes, a narrow and long face. He is shown with multiple facial expressions in the same image: happy, surprised, sad, angry, and neutral. Each expression is clearly separated in a grid layout. The style is clean vector-based, flat colors (no shading), similar to modern mobile apps or educational illustrations. Character wears a simplified superhero costume in red and blue (inspired by Spider-Man but without logos). The background is white or light gray to keep the focus on the character. --cref [UPLOADED_PHOTO_URL] --cw 100`;


const now = new Date();
const mockAttachments: Attachment[] = [
    { name: "reference_image.jpg", url: "https://picsum.photos/seed/ref1/200/150" },
    { name: "briefing_notes.pdf", url: "#" } // Placeholder URL
];

// Sample story pages data - PENDING text review (with some empty text for generation)
const sampleStoryPages_TextPending: StoryPage[] = [
    { pageNumber: 1, text: "", textStatus: 'pending' }, // Start empty
    { pageNumber: 2, text: "", textStatus: 'pending' }, // Start empty
    { pageNumber: 3, text: "She found herself in a land of talking teacups and mad hatters.", textStatus: 'pending' }, // Pre-filled example
];

// Sample story pages data - For combined 'visual_content_generation' stage
// State 1: Text accepted, Prompt pending generation/review
const sampleStoryPages_VisualContent_PromptPending: StoryPage[] = [
    { pageNumber: 1, text: "Bob the Builder started his day early.", textStatus: 'accepted', midjourneyPrompt: undefined, promptStatus: undefined, imageStatus: undefined }, // No visual content yet
    { pageNumber: 2, text: "His mission: build the grandest bridge mockville had ever seen.", textStatus: 'accepted', midjourneyPrompt: undefined, promptStatus: undefined, imageStatus: undefined },
    { pageNumber: 3, text: "Scoop, Muck, and Dizzy were ready to help.", textStatus: 'accepted', midjourneyPrompt: undefined, promptStatus: undefined, imageStatus: undefined },
];
// State 2: Text accepted, Prompt generated, Image generation pending
const sampleStoryPages_VisualContent_ImageGenPending: StoryPage[] = [
     { pageNumber: 1, text: "A knight rode through a dark forest.", textStatus: 'accepted', midjourneyPrompt: "Fantasy knight on horseback riding through dark enchanted forest, moonlight filtering through trees, oil painting style --ar 16:9", promptStatus: 'accepted', imageStatus: 'pending' }, // Prompt ready, image pending gen
     { pageNumber: 2, text: "He encountered a grumpy troll under a bridge.", textStatus: 'accepted', midjourneyPrompt: "Knight confronting a large grumpy troll under an old stone bridge, river flowing, fantasy art --v 6", promptStatus: 'accepted', imageStatus: 'pending' },
];
// State 3: Text accepted, Prompt exists, Composite image generated, selection pending
const sampleStoryPages_VisualContent_ImageSelectPending: StoryPage[] = [
    { pageNumber: 1, text: "A knight rode through a dark forest.", textStatus: 'accepted', midjourneyPrompt: "Fantasy knight on horseback riding through dark enchanted forest, moonlight filtering through trees, oil painting style --ar 16:9", promptStatus: 'accepted', compositeImageUrl: "https://picsum.photos/seed/knightComposite1/800/800", imageStatus: 'pending' }, // Composite ready
    { pageNumber: 2, text: "He encountered a grumpy troll under a bridge.", textStatus: 'accepted', midjourneyPrompt: "Knight confronting a large grumpy troll under an old stone bridge, river flowing, fantasy art --v 6", promptStatus: 'accepted', compositeImageUrl: "https://picsum.photos/seed/knightComposite2/800/800", imageStatus: 'pending' },
];
// State 4: Text accepted, Prompt exists, Final image selected, acceptance pending
const sampleStoryPages_VisualContent_ImageAcceptPending: StoryPage[] = [
    { pageNumber: 1, text: "A knight rode through a dark forest.", textStatus: 'accepted', midjourneyPrompt: "Fantasy knight on horseback riding through dark enchanted forest, moonlight filtering through trees, oil painting style --ar 16:9", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/knightFinal1/600/400", imageStatus: 'pending' }, // Final image ready for accept
    { pageNumber: 2, text: "He encountered a grumpy troll under a bridge.", textStatus: 'accepted', midjourneyPrompt: "Knight confronting a large grumpy troll under an old stone bridge, river flowing, fantasy art --v 6", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/knightFinal2/600/400", imageStatus: 'pending' },
];


// Sample story pages data - PENDING final review (all items accepted)
const sampleStoryPages_FinalReviewPending: StoryPage[] = [
    { pageNumber: 1, text: "A cute robot explored a vibrant planet.", textStatus: 'accepted', midjourneyPrompt: "Cute friendly robot exploring colorful alien planet, vibrant flora, cartoon style --ar 16:9", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/robot1/600/400", imageStatus: 'accepted' },
    { pageNumber: 2, text: "It befriended a shy, fluffy alien creature.", textStatus: 'accepted', midjourneyPrompt: "Cute robot befriending a shy fluffy alien creature, gentle interaction, pastel colors, kids illustration --v 6", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/robot2/600/400", imageStatus: 'accepted' },
];

// Sample story pages data - COMPLETED (ready for delivery)
const sampleStoryPages_Completed: StoryPage[] = [
    { pageNumber: 1, text: "A tramp walked down a lonely street.", textStatus: 'accepted', midjourneyPrompt: "Charlie Chaplin tramp walking down a cobblestone street, black and white film style, lonely mood --ar 4:3", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/tramp1/600/400", imageStatus: 'accepted' },
    { pageNumber: 2, text: "He slipped on a banana peel, comically.", textStatus: 'accepted', midjourneyPrompt: "Tramp slipping on banana peel, exaggerated motion, slapstick comedy, black and white silent film still --style raw", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/tramp2/600/400", imageStatus: 'accepted' },
    { pageNumber: 3, text: "He twirled his cane and tipped his hat.", textStatus: 'accepted', midjourneyPrompt: "Close up of Charlie Chaplin tramp twirling cane and tipping hat, charming expression, black and white photo", promptStatus: 'accepted', illustrationImageUrl: "https://picsum.photos/seed/tramp3/600/400", imageStatus: 'accepted' },
];


// --- Updated Mock Orders ---
let mockOrders: Order[] = [
    {
        id: "mock001",
        customerName: "Alice Mockland",
        email: "alice.mock@example.com",
        orderSummary: "A very curious mock story request about a tea party",
        status: "in_progress", // Changed to in_progress to match new first stage
        stage: "character_sheet_generation", // Starts here now
        createdAt: createMockTimestamp(new Date(now.getTime() - 6 * 86400000)), // Pushed back dates
        updatedAt: createMockTimestamp(new Date(now.getTime() - 6 * 86400000)),
        storyType: "Fantasy",
        language: "English",
        specialRequests: "Make it extra nonsensical!",
        attachments: [mockAttachments[0]], // Need photo attachment for character sheet
        characterSheet: { // Initialize character sheet data
            prompt: DEFAULT_CHARACTER_SHEET_PROMPT
                        .replace("[CHILD_NAME]", "Alice")
                        .replace("[SKIN_TONE]", "fair")
                        .replace("[HAIR_COLOR]", "blonde")
                        .replace("[EYE_COLOR]", "blue")
                        .replace("[UPLOADED_PHOTO_URL]", mockAttachments[0].url),
            status: 'pending', // Starts pending generation/review
            imageUrl: undefined,
        },
        storyPages: undefined, // No pages generated yet
    },
    {
        id: "mock009", // NEW: Order that has passed character sheet generation
        customerName: "Zayed Mockstar",
        email: "zayed.mock@example.com",
        orderSummary: "Story about Zayed the superhero",
        status: "in_progress",
        stage: "story_content_generation", // Passed character sheet, now generating text
        createdAt: createMockTimestamp(new Date(now.getTime() - 5.5 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 5 * 86400000)),
        storyType: "Superhero",
        language: "English",
        specialRequests: "Make him fly!",
        attachments: [{ name: "zayed_photo.jpg", url: "https://picsum.photos/seed/zayedPhoto/200/150" }],
        characterSheet: { // Character sheet is accepted
            prompt: "A flat 2D character sheet of a 4-year-old boy named Zayed... --cref https://picsum.photos/seed/zayedPhoto/200/150 --cw 100",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/zayedSheetAccepted/600/600", // Accepted sheet image
        },
        storyPages: sampleStoryPages_TextPending, // Text gen pending
    },
    {
        id: "mock005", // Renumbered for stage order
        customerName: "Test Order For Story Gen",
        email: "test.storygen@example.com",
        orderSummary: "Order specifically for testing story page generation about a brave mouse named Timothy who saves a kingdom from a sleepy dragon.",
        status: "in_progress",
        stage: "story_content_generation", // Actively in story text review
        createdAt: createMockTimestamp(new Date(now.getTime() - 5 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 5 * 86400000)),
        storyType: "Adventure",
        language: "English",
        specialRequests: "Make the dragon funny, not scary.",
        attachments: [],
        characterSheet: { // Assume character sheet was accepted for this one too
            prompt: "Character sheet for Timothy the mouse...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/timothySheet/600/600",
        },
        storyPages: sampleStoryPages_TextPending, // Use pending text pages (some empty)
    },
     {
        id: "mock002",
        customerName: "Bob The Mock Builder",
        email: "bob.mock@construction.net",
        orderSummary: "Mock story about building a bridge with talking tools",
        status: "in_progress",
        stage: "visual_content_generation", // In combined visual content generation stage (starting with prompts)
        createdAt: createMockTimestamp(new Date(now.getTime() - 4 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 2 * 86400000)),
        storyType: "Educational",
        language: "English",
        specialRequests: undefined,
        attachments: undefined,
        characterSheet: {
            prompt: "Character sheet for Bob...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/bobSheet/600/600",
        },
        storyPages: sampleStoryPages_VisualContent_PromptPending, // Text accepted, prompt/image work needed
    },
    {
        id: "mock006", // For image generation/selection stage
        customerName: "Sir Reginald Mockington III",
        email: "reginald.mock@chivalry.codes",
        orderSummary: "Mock epic of a knight's quest",
        status: "in_progress",
        stage: "visual_content_generation", // Also in visual content stage (now with prompts ready, ready for image gen)
        createdAt: createMockTimestamp(new Date(now.getTime() - 3 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 1 * 86400000 + 1 * 3600000)), // Updated a day ago + 1 hour
        storyType: "Fantasy Adventure",
        language: "English",
        specialRequests: "Make the troll look particularly grumpy.",
        attachments: [],
        characterSheet: {
            prompt: "Character sheet for Sir Reginald...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/reginaldSheet/600/600",
        },
        // Start with prompts generated, ready for image generation
        storyPages: sampleStoryPages_VisualContent_ImageGenPending,
        // Use this to test image selection UI immediately
        // storyPages: sampleStoryPages_VisualContent_ImageSelectPending,
        // Use this to test final image accept UI
        // storyPages: sampleStoryPages_VisualContent_ImageAcceptPending,
    },
     {
        id: "mock007", // New order for final review stage
        customerName: "Robbie Robot",
        email: "robbie.mock@ai.factory",
        orderSummary: "A tale of a friendly robot's exploration",
        status: "in_progress",
        stage: "final_review", // In final review stage
        createdAt: createMockTimestamp(new Date(now.getTime() - 2 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 12 * 3600000)), // Updated 12 hours ago
        storyType: "Sci-Fi Kids",
        language: "English",
        specialRequests: "Ensure the illustrations are bright and cheerful.",
        attachments: [],
        characterSheet: {
            prompt: "Character sheet for Robbie...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/robbieSheet/600/600",
        },
        storyPages: sampleStoryPages_FinalReviewPending, // Has pages with all items accepted
        finalStory: { // Add final story details
            pdfUrl: "https://example.com/mock-story-robot.pdf", // Placeholder URL, real generation would replace this
            assemblyStatus: "pending", // Starts pending review
        }
    },
    {
        id: "mock003",
        customerName: "Charlie Mocklin",
        email: "charlie.mock@silentfilms.org",
        orderSummary: "A silent mock story masterpiece with slapstick",
        status: "completed", // Ready for delivery
        stage: "completed", // Completed stage means approved, ready for delivery
        createdAt: createMockTimestamp(new Date(now.getTime() - 11 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 3 * 86400000)),
        storyType: "Classic Comedy",
        language: "N/A",
        specialRequests: undefined,
        attachments: undefined,
        characterSheet: {
            prompt: "Character sheet for Charlie...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/charlieSheet/600/600",
        },
        storyPages: sampleStoryPages_Completed, // All text, prompts, and images accepted
        finalStory: { // Add final story details
            pdfUrl: "https://example.com/mock-story-tramp.pdf", // Example final URL
            assemblyStatus: "approved",
        }
    },
    {
        id: "mock008", // New order that has been delivered
        customerName: "Delivered Dave",
        email: "dave.delivered@example.com",
        orderSummary: "Story about a punctual postman",
        status: "delivered", // Final status
        stage: "delivered", // Final stage
        createdAt: createMockTimestamp(new Date(now.getTime() - 15 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 1 * 86400000)), // Delivered yesterday
        storyType: "Realistic Fiction",
        language: "English",
        specialRequests: "Include a rainy scene.",
        attachments: [],
        characterSheet: {
            prompt: "Character sheet for Dave...",
            status: 'accepted',
            imageUrl: "https://picsum.photos/seed/daveSheet/600/600",
        },
        storyPages: sampleStoryPages_Completed.map(p => ({...p})), // Use completed pages data
        finalStory: {
            pdfUrl: "https://example.com/mock-story-postman.pdf",
            assemblyStatus: "approved",
        },
        deliveryInfo: { // Add delivery info
            method: "email",
            deliveredAt: createMockTimestamp(new Date(now.getTime() - 1 * 86400000)), // Delivered yesterday
            downloadLink: "https://example.com/mock-story-postman.pdf"
        }
    },
    {
        id: "mock004",
        customerName: "Diana Mock Prince",
        email: "diana.mock@themyscira.gov",
        orderSummary: "Mock tale of heroism gone wrong, resulting in chaos",
        status: "failed",
        stage: "failed", // Failed stage
        createdAt: createMockTimestamp(new Date(now.getTime() - 8 * 86400000)),
        updatedAt: createMockTimestamp(new Date(now.getTime() - 7 * 86400000)),
        storyType: "Superhero Tragedy",
        language: "English",
        specialRequests: "Focus on the internal conflict and the consequences.",
        attachments: mockAttachments,
        characterSheet: { // Character sheet generation might have failed too
            prompt: "Failed attempt at character sheet for Diana...",
            status: 'pending', // Stuck pending or failed
        },
        storyPages: undefined,
    },
];

// Simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SIMULATED_DELAY_MS = 500; // 0.5 second delay
const REGENERATION_DELAY_MS = 3000; // Increased delay for AI generation
const API_CALL_DELAY_MS = 2000; // Delay for simulating external API calls (like MidJourney trigger)
const MOCK_WEBHOOK_DELAY_MS = 5000; // Delay for simulating webhook response (MidJourney generation time)
const PDF_GENERATION_DELAY_MS = 2500; // Delay for mock PDF assembly
const EMAIL_SEND_DELAY_MS = 1000; // Delay for simulating email send
const CHARACTER_SHEET_GENERATION_DELAY_MS = 7000; // Longer delay for character sheet (~1 min MJ)

// --- Mock Service Functions ---

/**
 * Fetches all mock orders, sorted by creation date descending.
 * @returns {Promise<Order[]>} A promise that resolves to an array of mock orders.
 */
export const getOrders = async (): Promise<Order[]> => {
  console.log("getOrders: Fetching MOCK orders...");
  await delay(SIMULATED_DELAY_MS);
  // Sort mock orders by date before returning (descending)
  const sortedOrders = [...mockOrders].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  console.log(`getOrders: Returning ${sortedOrders.length} MOCK orders.`);
  return Promise.resolve(sortedOrders);
};

/**
 * Fetches a single mock order by its ID.
 * @param orderId The ID of the order to fetch.
 * @returns {Promise<Order | null>} A promise that resolves to the Order object or null if not found.
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
    console.log(`getOrderById: Fetching MOCK order with ID: ${orderId}`);
    await delay(SIMULATED_DELAY_MS / 2); // Shorter delay for single fetch

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
        console.error("getOrderById: Invalid or missing orderId provided.");
        return Promise.resolve(null);
    }

    const order = mockOrders.find(o => o.id === orderId);

    if (order) {
      console.log(`getOrderById: MOCK Document ${orderId} found.`);
      // Deep clone the order to prevent mutations affecting the "database" directly
      // Simple JSON stringify/parse for deep clone in mock environment
      return Promise.resolve(JSON.parse(JSON.stringify(order)));
    } else {
      console.log(`getOrderById: No MOCK document found! ID: ${orderId}`);
      return Promise.resolve(null);
    }
};

/**
 * Updates specific fields of a mock order. Handles status, stage, finalStory, deliveryInfo, storyPages, and characterSheet.
 * @param orderId The ID of the order to update.
 * @param updates An object containing the fields to update.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} Throws an error if the order is not found or update values are invalid.
 */
export const updateOrder = async (
    orderId: string,
    updates: Partial<Pick<Order, 'status' | 'stage' | 'finalStory' | 'deliveryInfo' | 'storyPages' | 'characterSheet'>>
): Promise<void> => {
    console.log(`updateOrder: Attempting to update MOCK order ${orderId} with:`, Object.keys(updates));
    await delay(SIMULATED_DELAY_MS / 2);

    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
        console.error("updateOrder: Invalid or missing Order ID.");
        throw new Error("Invalid Order ID provided for update.");
    }

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        console.error(`updateOrder: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    // IMPORTANT: Use a temporary mutable copy for updates
    let orderToUpdate = { ...mockOrders[orderIndex] };

    // Validate status if provided
    if (updates.status) {
        const validStatuses: OrderStatus[] = ['pending', 'in_progress', 'completed', 'failed', 'delivered'];
        if (!validStatuses.includes(updates.status)) {
            console.error(`updateOrder: Invalid status provided: ${updates.status}`);
            throw new Error(`Invalid status value: ${updates.status}`);
        }
        orderToUpdate.status = updates.status;
    }

    // Validate stage if provided
    if (updates.stage) {
        const validStages: OrderStage[] = [
            'character_sheet_generation', 'pending_approval', 'story_content_generation',
            'visual_content_generation', 'final_review', 'completed', 'failed', 'delivered'
        ];
        if (!validStages.includes(updates.stage)) {
            console.error(`updateOrder: Invalid stage provided: ${updates.stage}`);
            throw new Error(`Invalid stage value: ${updates.stage}`);
        }
        orderToUpdate.stage = updates.stage;
    }

    // Update finalStory if provided
    if (updates.finalStory) {
        const validAssemblyStatuses: AssemblyStatus[] = ['pending', 'approved', 'needs_correction'];
        if (!validAssemblyStatuses.includes(updates.finalStory.assemblyStatus)) {
             console.error(`updateOrder: Invalid finalStory.assemblyStatus provided: ${updates.finalStory.assemblyStatus}`);
             throw new Error(`Invalid finalStory.assemblyStatus value: ${updates.finalStory.assemblyStatus}`);
        }
        // Merge updates with existing finalStory or create if it doesn't exist
        orderToUpdate.finalStory = {
            ...(orderToUpdate.finalStory || { assemblyStatus: 'pending' }), // Default to pending if creating
            ...updates.finalStory,
        };
    }

    // Update deliveryInfo if provided
    if (updates.deliveryInfo) {
        // Basic validation (can be expanded)
        if (!updates.deliveryInfo.method || !updates.deliveryInfo.deliveredAt) {
            console.error(`updateOrder: Invalid deliveryInfo provided:`, updates.deliveryInfo);
            throw new Error(`Invalid deliveryInfo: Missing method or deliveredAt.`);
        }
        orderToUpdate.deliveryInfo = {
            ...orderToUpdate.deliveryInfo, // Keep existing fields if any
            ...updates.deliveryInfo,
        };
    }

    // Update storyPages if provided (used internally by generation steps)
    if (updates.storyPages) {
        // Basic validation: ensure it's an array
        if (!Array.isArray(updates.storyPages)) {
            console.error(`updateOrder: Invalid storyPages provided:`, updates.storyPages);
            throw new Error(`Invalid storyPages data: Must be an array.`);
        }
        // Simple deep clone for mock update
        orderToUpdate.storyPages = JSON.parse(JSON.stringify(updates.storyPages));
    }

    // Update characterSheet if provided
    if (updates.characterSheet) {
        const validCharacterSheetStatuses: CharacterSheetStatus[] = ['pending', 'accepted'];
         if (!validCharacterSheetStatuses.includes(updates.characterSheet.status)) {
            console.error(`updateOrder: Invalid characterSheet.status provided: ${updates.characterSheet.status}`);
            throw new Error(`Invalid characterSheet.status value: ${updates.characterSheet.status}`);
        }
         // Perform deep clone/merge for character sheet
        orderToUpdate.characterSheet = JSON.parse(JSON.stringify({
            ...(orderToUpdate.characterSheet || { prompt: '', status: 'pending' }), // Provide default if non-existent
            ...updates.characterSheet
        }));
    }


    // Update timestamp
    orderToUpdate.updatedAt = createMockTimestamp(new Date());

    // Update the actual object in the mock array
    mockOrders[orderIndex] = orderToUpdate; // Assign the updated temporary object back

    console.log(`updateOrder: MOCK Order ${orderId} updated successfully.`);
    return Promise.resolve();
};


/**
 * Updates the status of a specific story page's TEXT within a mock order.
 * Checks if all text pages are accepted and updates the order stage if necessary.
 * @param orderId The ID of the order containing the page.
 * @param pageNumber The number of the page to update.
 * @param newTextStatus The new status for the page text ('accepted', 'pending', etc.).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} Throws an error if the order or page is not found.
 */
export const updateStoryPageTextStatus = async (
    orderId: string,
    pageNumber: number,
    newTextStatus: PageItemStatus
): Promise<void> => {
    console.log(`updateStoryPageTextStatus: Updating TEXT page ${pageNumber} of MOCK order ${orderId} to status ${newTextStatus}`);
    await delay(SIMULATED_DELAY_MS / 3); // Faster update for page status

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`updateStoryPageTextStatus: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    // Clone the order to avoid direct mutation before updateOrder call
    let order = { ...mockOrders[orderIndex] };

    if (!order.storyPages) {
        console.error(`updateStoryPageTextStatus: MOCK Order ${orderId} has no story pages.`);
        throw new Error(`Order ${orderId} does not have story pages to update.`);
    }
     if (order.stage !== 'story_content_generation') {
         console.warn(`updateStoryPageTextStatus: Cannot update text status for order ${orderId} as it's not in 'story_content_generation' stage (current: ${order.stage})`);
         return Promise.resolve(); // Or throw error if this shouldn't happen
     }

    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
        console.error(`updateStoryPageTextStatus: Page ${pageNumber} not found in MOCK order ${orderId}.`);
        throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);
    }

    // Clone storyPages to avoid nested mutation
    const updatedStoryPages = [...order.storyPages];
    updatedStoryPages[pageIndex] = {
        ...updatedStoryPages[pageIndex],
        textStatus: newTextStatus
    };
    order.storyPages = updatedStoryPages; // Assign the updated pages array

    console.log(`updateStoryPageTextStatus: TEXT Page ${pageNumber} status updated locally.`);

    // Check if all TEXT pages are now accepted
    const allTextPagesAccepted = order.storyPages.every(p => p.textStatus === 'accepted');
    let stageUpdate: Partial<Pick<Order, 'stage' | 'storyPages'>> = { storyPages: order.storyPages };

    if (allTextPagesAccepted && order.stage === 'story_content_generation') {
        console.log(`updateStoryPageTextStatus: All TEXT pages accepted for order ${orderId}. Moving to Visual Content stage.`);
        stageUpdate.stage = 'visual_content_generation';

        // Simulate generating initial MidJourney prompts for each page
        order.storyPages = order.storyPages.map(page => {
            if (!page.midjourneyPrompt) { // Only generate if prompt doesn't exist
                return {
                    ...page,
                    midjourneyPrompt: `Mock MJ Prompt for "${page.text.substring(0, 30)}...", Style: simple cartoon ${Math.random() > 0.5 ? '--ar 16:9' : ''} --v 6 --cref ${order.characterSheet?.imageUrl || ''}`, // Include character sheet ref
                    // Initialize prompt and image statuses for the next stage
                    promptStatus: 'accepted', // Mark prompt as accepted implicitly (ready for image gen)
                    imageStatus: 'pending', // Set image status to pending
                };
            }
            return { // If prompt already exists, just ensure statuses are ready
                ...page,
                promptStatus: page.promptStatus || 'accepted', // Keep existing or default to accepted
                imageStatus: page.imageStatus || 'pending', // Keep existing or default to pending
            };
        });
        stageUpdate.storyPages = order.storyPages; // Update pages in the update object
        console.log(`updateStoryPageTextStatus: Order ${orderId} stage set to 'visual_content_generation' and initial prompts/statuses prepared.`);

    } else {
         console.log(`updateStoryPageTextStatus: Not all TEXT pages accepted yet for order ${orderId}. Current stage: ${order.stage}`);
    }

    // Update the order in the mock database with new page status and potential stage/prompt updates
    await updateOrder(orderId, stageUpdate);


    return Promise.resolve();
};

/**
 * Generates or regenerates the text for a specific story page using Genkit AI flow.
 * @param orderId The ID of the order.
 * @param pageNumber The page number to regenerate.
 * @returns {Promise<string>} A promise that resolves with the new AI-generated text.
 * @throws {Error} Throws an error if the order/page is not found or AI generation fails.
 */
export const regenerateStoryPageText = async (
    orderId: string,
    pageNumber: number
): Promise<string> => {
    console.log(`regenerateStoryPageText: Regenerating TEXT for page ${pageNumber} of MOCK order ${orderId} using AI.`);

    // 1. Find order and page data
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone

    if (!order.storyPages) throw new Error(`Order ${orderId} has no story pages.`);
    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);

     if (order.stage !== 'story_content_generation') {
         throw new Error(`Cannot regenerate text for order ${orderId}, not in 'story_content_generation' stage.`);
     }


    // Get previous page text for context, if applicable
    const previousPage = pageIndex > 0 ? order.storyPages[pageIndex - 1] : null;

    // 2. Set page TEXT status to 'regenerating' (use updateOrder for consistency)
    const regeneratingPages = order.storyPages.map((p, idx) =>
        idx === pageIndex ? { ...p, textStatus: 'regenerating' as const } : p
    );
     // Update the mutable order object first for context
    order.storyPages = regeneratingPages;
    // Persist the change
    await updateOrder(orderId, { storyPages: order.storyPages });


    // 3. Prepare input for the Genkit flow
    const flowInput: GenerateStoryPageInput = {
      orderSummary: order.orderSummary,
      customerName: order.customerName,
      pageNumber: pageNumber,
      totalPages: order.storyPages.length, // Assuming all pages are initialized
      storyType: order.storyType,
      language: order.language || 'English', // Default to English if not specified
      specialRequests: order.specialRequests,
      previousPageText: previousPage?.textStatus === 'accepted' ? previousPage.text : undefined, // Only provide accepted previous text
    };

    let newText: string;
    try {
        // 4. Call the Genkit flow (simulates AI call delay implicitly)
        console.log("Calling generateStoryPageText flow with input:", flowInput);
        const result = await generateStoryPageText(flowInput);
        newText = result.generatedText;
        console.log(`regenerateStoryPageText: AI generated text for page ${pageNumber}: "${newText.substring(0, 50)}..."`);
    } catch (error) {
        console.error(`regenerateStoryPageText: AI generation failed for page ${pageNumber}, order ${orderId}:`, error);
        // Revert status back to pending on failure
        // Refetch order to get latest state before reverting
        const currentOrderState = await getOrderById(orderId);
        if (!currentOrderState || !currentOrderState.storyPages) {
            throw new Error(`Order ${orderId} vanished or lost pages during AI failure.`);
        }
        const revertPageIndex = currentOrderState.storyPages.findIndex(p => p.pageNumber === pageNumber);
        if (revertPageIndex === -1) {
            throw new Error(`Page ${pageNumber} vanished during AI failure.`);
        }
        const revertPages = currentOrderState.storyPages.map((p, idx) =>
            idx === revertPageIndex ? { ...p, textStatus: 'pending' as const } : p
        );
        await updateOrder(orderId, { storyPages: revertPages });
        throw new Error(`AI text generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 5. Update the page text and set status back to 'pending' using updateOrder
     // Refetch order to get latest state before updating with new text
     const finalOrderState = await getOrderById(orderId);
     if (!finalOrderState || !finalOrderState.storyPages) {
         throw new Error(`Order ${orderId} vanished or lost pages before final update.`);
     }
      const finalPageIndex = finalOrderState.storyPages.findIndex(p => p.pageNumber === pageNumber);
      if (finalPageIndex === -1) {
          throw new Error(`Page ${pageNumber} vanished before final update.`);
      }
    const finalPages = finalOrderState.storyPages.map((p, idx) =>
        idx === finalPageIndex ? { ...p, text: newText, textStatus: 'pending' as const } : p
    );
    await updateOrder(orderId, { storyPages: finalPages });

    console.log(`regenerateStoryPageText: TEXT regenerated by AI for page ${pageNumber}, order ${orderId}. Status set to pending.`);

    // 6. Return the new text
    return Promise.resolve(newText);
};


// --- Functions for MidJourney Prompts ---

/**
 * Updates the status of a specific story page's MidJourney PROMPT within a mock order.
 * This function is now primarily for INTERNAL use by regenerateStoryPagePrompt
 * to manage the 'regenerating' state, not directly called by UI 'Accept'.
 * @param orderId The ID of the order containing the page.
 * @param pageNumber The number of the page whose prompt status to update.
 * @param newPromptStatus The new status for the page prompt ('accepted', 'pending', etc.).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateStoryPagePromptStatus = async (
    orderId: string,
    pageNumber: number,
    newPromptStatus: PageItemStatus
): Promise<void> => {
    console.log(`INTERNAL updateStoryPagePromptStatus: Updating PROMPT page ${pageNumber} of MOCK order ${orderId} to status ${newPromptStatus}`);
    await delay(SIMULATED_DELAY_MS / 4); // Very quick internal update

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`updateStoryPagePromptStatus: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    let order = { ...mockOrders[orderIndex] }; // Clone

    if (!order.storyPages) {
        console.error(`updateStoryPagePromptStatus: MOCK Order ${orderId} has no story pages.`);
        throw new Error(`Order ${orderId} does not have story pages to update.`);
    }

    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
        console.error(`updateStoryPagePromptStatus: Page ${pageNumber} not found in MOCK order ${orderId}.`);
        throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);
    }

    // Update the specific page's prompt status (ensure storyPages is cloned before modification)
    const updatedStoryPages = [...order.storyPages];
    updatedStoryPages[pageIndex] = {
        ...updatedStoryPages[pageIndex],
        promptStatus: newPromptStatus
    };
    order.storyPages = updatedStoryPages; // Assign updated array

    console.log(`updateStoryPagePromptStatus: PROMPT Page ${pageNumber} status updated internally to ${newPromptStatus}.`);

    // Update the order in the mock DB
    await updateOrder(orderId, { storyPages: order.storyPages });

    return Promise.resolve();
};


/**
 * Simulates regenerating the MidJourney prompt for a specific story page.
 * @param orderId The ID of the order.
 * @param pageNumber The page number whose prompt to regenerate.
 * @returns {Promise<string>} A promise that resolves with the new mock prompt.
 * @throws {Error} Throws an error if the order or page is not found.
 */
export const regenerateStoryPagePrompt = async (
    orderId: string,
    pageNumber: number
): Promise<string> => {
    console.log(`regenerateStoryPagePrompt: Regenerating PROMPT for page ${pageNumber} of MOCK order ${orderId}`);

    // 1. Find the order and page
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone
    if (!order.storyPages) throw new Error(`Order ${orderId} has no story pages.`);
    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);

    if (order.stage !== 'visual_content_generation') {
         throw new Error(`Cannot regenerate prompt for order ${orderId}, not in 'visual_content_generation' stage.`);
    }

    // 2. Set page PROMPT status to 'regenerating' internally
    // Create updated pages array first
     const regeneratingPages = order.storyPages.map((p, idx) =>
        idx === pageIndex ? { ...p, promptStatus: 'regenerating' as const } : p
    );
    // Update the mutable order object first for context
    order.storyPages = regeneratingPages;
     // Persist the change
    await updateOrder(orderId, { storyPages: order.storyPages });


    // 3. Simulate AI call delay
    await delay(REGENERATION_DELAY_MS);

    // 4. Generate new mock prompt
    const newPrompt = `Regenerated mock MidJourney prompt for page ${pageNumber}. Focus: cinematic lighting, random style: ${Math.random() > 0.5 ? 'Pixar' : 'Claymation'} ${Math.random() > 0.5 ? '--ar 3:2' : '--ar 1:1'} --chaos ${Math.floor(Math.random()*50)} --cref ${order.characterSheet?.imageUrl || ''}`; // Include character ref

    // 5. Update the page prompt and set status back to 'accepted' (implicitly ready for image gen again)
    // Retrieve the latest order state after potential delay
    const currentOrder = await getOrderById(orderId); // Refetch latest state
    if (!currentOrder || !currentOrder.storyPages) throw new Error(`Order ${orderId} vanished or lost pages during prompt regeneration.`);
    const currentPageIndex = currentOrder.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (currentPageIndex === -1) throw new Error(`Page ${pageNumber} vanished during prompt regeneration.`);

    const finalPages = currentOrder.storyPages.map((p, idx) => {
        if (idx === currentPageIndex) {
            return {
                ...p,
                midjourneyPrompt: newPrompt,
                illustrationImageUrl: undefined, // Reset related image statuses/data
                compositeImageUrl: undefined,
                imageStatus: 'pending' as const, // Reset image status
                promptStatus: 'accepted' as const, // Set prompt status back to accepted
            };
        }
        return p;
    });
    await updateOrder(orderId, { storyPages: finalPages });


    console.log(`regenerateStoryPagePrompt: PROMPT regenerated for page ${pageNumber}, order ${orderId}. Status set back to accepted/ready.`);

    // 6. Return the new prompt
    return Promise.resolve(newPrompt);
};


// --- New Functions for Illustration Images ---

/**
 * Updates the status of a specific story page's ILLUSTRATION item within a mock order.
 * Used to track review/acceptance *after* an image (or composite) has been generated/selected.
 * Checks if all images are accepted and moves the order to the 'final_review' stage if necessary.
 * @param orderId The ID of the order containing the page.
 * @param pageNumber The number of the page whose image status to update.
 * @param newImageStatus The new status for the page image ('accepted', 'pending', etc.).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 * @throws {Error} Throws an error if the order or page is not found.
 */
export const updateStoryPageImageStatus = async (
    orderId: string,
    pageNumber: number,
    newImageStatus: PageItemStatus
): Promise<void> => {
    console.log(`updateStoryPageImageStatus: Updating IMAGE status for page ${pageNumber} of MOCK order ${orderId} to status ${newImageStatus}`);
    await delay(SIMULATED_DELAY_MS / 3);

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`updateStoryPageImageStatus: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    let order = { ...mockOrders[orderIndex] }; // Clone

    if (order.stage !== 'visual_content_generation') {
        console.warn(`updateStoryPageImageStatus: Cannot update image status for order ${orderId} as it's not in 'visual_content_generation' stage (current: ${order.stage})`);
        return Promise.resolve();
    }
    if (!order.storyPages) {
        console.error(`updateStoryPageImageStatus: MOCK Order ${orderId} has no story pages.`);
        throw new Error(`Order ${orderId} does not have story pages to update.`);
    }

    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
        console.error(`updateStoryPageImageStatus: Page ${pageNumber} not found in MOCK order ${orderId}.`);
        throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);
    }

    // Clone pages before modification
    let updatedStoryPages = [...order.storyPages];
    let pageToUpdate = { ...updatedStoryPages[pageIndex] };

     // Check if the image status field exists (it should if prompts were accepted)
     if (pageToUpdate.imageStatus === undefined) {
         console.warn(`updateStoryPageImageStatus: Image status field missing for page ${pageNumber}, order ${orderId}. Initializing to 'pending'.`);
         pageToUpdate.imageStatus = 'pending';
     }

     // Ensure we only accept if an illustration image URL is present
     if (newImageStatus === 'accepted' && !pageToUpdate.illustrationImageUrl) {
         console.error(`updateStoryPageImageStatus: Cannot accept image for page ${pageNumber} as illustrationImageUrl is missing.`);
         throw new Error(`Cannot accept image for page ${pageNumber} without a final illustration URL.`);
     }

    // Update the specific page's image status
    pageToUpdate.imageStatus = newImageStatus;
    updatedStoryPages[pageIndex] = pageToUpdate;
    order.storyPages = updatedStoryPages; // Assign updated pages back

    console.log(`updateStoryPageImageStatus: IMAGE Page ${pageNumber} status updated locally.`);

    // Check if all required items (text, prompt, image) are accepted for all pages
    const allPagesVisuallyAccepted = order.storyPages.every(p =>
        p.textStatus === 'accepted' && // Ensure text still accepted
        p.promptStatus === 'accepted' && // Ensure prompt still considered ready
        p.imageStatus === 'accepted' && // IMAGE is accepted
        !!p.illustrationImageUrl
    );

    let stageUpdate: Partial<Pick<Order, 'stage' | 'storyPages' | 'finalStory'>> = { storyPages: order.storyPages };

    if (allPagesVisuallyAccepted && order.stage === 'visual_content_generation') {
        console.log(`updateStoryPageImageStatus: All visual content accepted for order ${orderId}. Moving to Final Review stage.`);
        stageUpdate.stage = 'final_review';

        // Simulate generating the final PDF/assembly
        console.log(`updateStoryPageImageStatus: Simulating final story assembly for ${orderId}...`);
        await delay(PDF_GENERATION_DELAY_MS); // Simulate assembly time
        const mockPdfUrl = `https://example.com/mock-story-${orderId}.pdf`;
        const finalStoryData: FinalStory = {
             pdfUrl: mockPdfUrl,
             assemblyStatus: "pending", // Assembly done, awaiting review
         };
        stageUpdate.finalStory = finalStoryData; // Add final story data to the update

        console.log(`updateStoryPageImageStatus: Mock PDF generated: ${mockPdfUrl}. Preparing to update order.`);

    } else {
         console.log(`updateStoryPageImageStatus: Not all visual content accepted yet for order ${orderId}. Current stage: ${order.stage}`);
    }

    // Update the order in the mock database
    await updateOrder(orderId, stageUpdate);


    return Promise.resolve();
};


/**
 * Simulates initiating the MidJourney image generation process for a specific page.
 * It marks the imageStatus as 'regenerating' and simulates the API call + webhook delay.
 * Requires the text to be accepted and a prompt to exist.
 * @param orderId The ID of the order.
 * @param pageNumber The page number whose image to generate.
 * @returns {Promise<void>} A promise that resolves when the *mock* webhook processing is complete.
 * @throws {Error} Throws an error if the order, page, or prompt is not found/ready.
 */
export const generateMidJourneyImage = async (
    orderId: string,
    pageNumber: number
): Promise<void> => {
    console.log(`generateMidJourneyImage: Initiating IMAGE generation for page ${pageNumber} of MOCK order ${orderId}`);

    // --- 1. Find Order and Page, Validate ---
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone

    if (order.stage !== 'visual_content_generation') {
        throw new Error(`Cannot generate image for order ${orderId}, not in 'visual_content_generation' stage.`);
    }
    if (!order.storyPages) throw new Error(`Order ${orderId} has no story pages.`);
    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);
    let page = { ...order.storyPages[pageIndex] }; // Clone page

    if (page.textStatus !== 'accepted') {
         throw new Error(`Text for page ${pageNumber} must be accepted before generating image.`);
    }
    if (!page.midjourneyPrompt) {
        throw new Error(`MidJourney prompt missing for page ${pageNumber} in order ${orderId}. Generate or regenerate the prompt first.`);
    }
    // No longer check promptStatus === 'accepted' as it's implicit if a prompt exists in this stage

    // --- 2. Update Page Status to Regenerating ---
    page.imageStatus = 'regenerating'; // Use imageStatus for image generation process
    page.compositeImageUrl = undefined; // Clear previous composite if any
    page.illustrationImageUrl = undefined; // Clear final image URL

    // Update page within cloned pages array
    const updatedPages = [...order.storyPages];
    updatedPages[pageIndex] = page;
    order.storyPages = updatedPages; // Assign back to cloned order

    // Persist the 'regenerating' status update immediately
    await updateOrder(orderId, { storyPages: order.storyPages });
    console.log(`generateMidJourneyImage: Set page ${pageNumber} imageStatus to 'regenerating'. Simulating API call...`);

    // --- 3. Simulate MidJourney API Call ---
    // TODO: Replace with actual API call to Piapi using axios or fetch
    console.log(`generateMidJourneyImage: MOCKING API call with prompt: "${page.midjourneyPrompt}"`);
    await delay(API_CALL_DELAY_MS);
    console.log(`generateMidJourneyImage: Mock API call for page ${pageNumber} successful. Waiting for mock webhook...`);

    // --- 4. Simulate Webhook Delay and Response ---
    await delay(MOCK_WEBHOOK_DELAY_MS);
    const mockCompositeImageUrl = `https://picsum.photos/seed/${orderId}-page${pageNumber}-comp${Date.now()}/800/800`;
    console.log(`generateMidJourneyImage: Mock webhook received for page ${pageNumber}. Composite Image URL: ${mockCompositeImageUrl}`);

    // --- 5. Update Order with Composite Image URL and Reset Status ---
    // Refetch order data in case it changed during the delay (Important!)
    const currentOrderData = await getOrderById(orderId);
    if (!currentOrderData || !currentOrderData.storyPages) {
        console.error("generateMidJourneyImage: Order vanished or lost pages during webhook delay!");
        return; // Or throw error
    }
    const currentPageIndex = currentOrderData.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (currentPageIndex === -1) {
         console.error(`generateMidJourneyImage: Page ${pageNumber} vanished during webhook delay!`);
         return;
    }

    // Prepare final update payload
    const finalPagesUpdate = [...currentOrderData.storyPages];
    finalPagesUpdate[currentPageIndex] = {
        ...finalPagesUpdate[currentPageIndex],
        compositeImageUrl: mockCompositeImageUrl,
        imageStatus: 'pending' // Reset to pending for selection
    };

    await updateOrder(orderId, { storyPages: finalPagesUpdate });


    console.log(`generateMidJourneyImage: Updated order ${orderId} page ${pageNumber} with composite image URL. Status set to 'pending' for selection.`);

    return Promise.resolve();
};


/**
 * Simulates selecting one quadrant from the composite image as the final illustration.
 * @param orderId The ID of the order.
 * @param pageNumber The page number being updated.
 * @param selectedQuadrant The index (0-3) of the selected quadrant.
 * @returns {Promise<void>} A promise that resolves when the selection is processed.
 * @throws {Error} Throws an error if the order, page, or composite image URL is missing.
 */
export const selectMidJourneyImageQuadrant = async (
    orderId: string,
    pageNumber: number,
    selectedQuadrant: number // 0 = top-left, 1 = top-right, 2 = bottom-left, 3 = bottom-right
): Promise<void> => {
    console.log(`selectMidJourneyImageQuadrant: Selecting quadrant ${selectedQuadrant} for page ${pageNumber}, order ${orderId}`);
    await delay(SIMULATED_DELAY_MS / 3); // Quick selection update

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone

     if (order.stage !== 'visual_content_generation') {
        throw new Error(`Cannot select image quadrant for order ${orderId}, not in 'visual_content_generation' stage.`);
    }
    if (!order.storyPages) throw new Error(`Order ${orderId} has no story pages.`);
    const pageIndex = order.storyPages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) throw new Error(`Page ${pageNumber} not found in order ${orderId}.`);
    let page = { ...order.storyPages[pageIndex] }; // Clone page

    if (!page.compositeImageUrl) {
        throw new Error(`Composite image URL missing for page ${pageNumber}, cannot select quadrant.`);
    }
    if (selectedQuadrant < 0 || selectedQuadrant > 3) {
        throw new Error(`Invalid quadrant index: ${selectedQuadrant}. Must be 0-3.`);
    }

    // --- Simulate "extracting" the quadrant ---
    const finalImageUrl = `https://picsum.photos/seed/${orderId}-page${pageNumber}-finalQuad${selectedQuadrant}/600/400`;
    console.log(`selectMidJourneyImageQuadrant: Mock final image URL generated: ${finalImageUrl}`);

    // --- Update Page Data ---
    page.illustrationImageUrl = finalImageUrl;
    page.compositeImageUrl = undefined; // Clear the composite URL as selection is made
    page.imageStatus = 'pending'; // Keep status 'pending' for final acceptance

    // Update page within cloned pages array
    const updatedPages = [...order.storyPages];
    updatedPages[pageIndex] = page;
    order.storyPages = updatedPages; // Assign back to cloned order

    // Persist the update
    await updateOrder(orderId, { storyPages: order.storyPages });

    console.log(`selectMidJourneyImageQuadrant: Page ${pageNumber} updated with final image URL. Status remains 'pending' for final review/acceptance.`);

    // Stage progression check is handled by updateStoryPageImageStatus when 'Accept Image' is clicked

    return Promise.resolve();
};


// --- Function for Final Review Stage ---

/**
 * Approves the final assembled story for a mock order.
 * Sets the order stage to 'completed' and status to 'completed'.
 * This means the order is now ready for delivery.
 * @param orderId The ID of the order to approve.
 * @returns {Promise<void>} A promise that resolves when the approval is complete.
 * @throws {Error} Throws an error if the order is not found or not in the correct stage.
 */
export const approveFinalStory = async (orderId: string): Promise<void> => {
    console.log(`approveFinalStory: Approving final story for MOCK order ${orderId}.`);
    await delay(SIMULATED_DELAY_MS / 2);

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`approveFinalStory: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    const order = mockOrders[orderIndex];

    if (order.stage !== 'final_review') {
        console.warn(`approveFinalStory: Order ${orderId} is not in 'final_review' stage (current: ${order.stage}). Cannot approve.`);
        throw new Error(`Order ${orderId} cannot be approved as it's not in the final review stage.`);
    }
    if (!order.finalStory) {
        console.error(`approveFinalStory: Order ${orderId} is missing finalStory data. Cannot approve.`);
        throw new Error(`Order ${orderId} has no final story data to approve.`);
    }

    // Update finalStory status and overall order status/stage to 'completed' (ready for delivery)
    const updates: Partial<Order> = {
        status: 'completed', // Ready for delivery
        stage: 'completed', // Ready for delivery
        finalStory: {
            ...order.finalStory,
            assemblyStatus: 'approved',
        }
    };

    await updateOrder(orderId, updates);

    console.log(`approveFinalStory: Final story approved for order ${orderId}. Order marked as completed (ready for delivery).`);
    return Promise.resolve();
};

/**
 * Sets the final story assembly status to 'needs_correction' for a mock order.
 * Optionally moves the order back to a specified stage (e.g., 'visual_content_generation').
 * @param orderId The ID of the order requiring correction.
 * @param targetStage (Optional) The stage to move the order back to. Defaults to staying in 'final_review'.
 * @returns {Promise<void>} A promise that resolves when the correction request is processed.
 * @throws {Error} Throws an error if the order is not found.
 */
export const requestCorrection = async (orderId: string, targetStage?: OrderStage): Promise<void> => {
    console.log(`requestCorrection: Requesting correction for MOCK order ${orderId}. Target stage: ${targetStage || 'staying in final_review'}`);
    await delay(SIMULATED_DELAY_MS / 2);

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`requestCorrection: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    const order = mockOrders[orderIndex];

    // Update finalStory status
    const finalStoryUpdates: FinalStory = {
        ...(order.finalStory || { pdfUrl: '#', assemblyStatus: 'pending' }), // Ensure finalStory object exists
        assemblyStatus: 'needs_correction',
    };


    const updates: Partial<Order> = {
        finalStory: finalStoryUpdates,
        status: 'in_progress', // Revert status to in_progress
    };

    // Optionally change the stage if a target stage is provided
    if (targetStage) {
        // Ensure target stage is valid for going back
        const validTargetStages: OrderStage[] = ['character_sheet_generation', 'story_content_generation', 'visual_content_generation', 'final_review'];
        if (!validTargetStages.includes(targetStage)) {
            console.error(`requestCorrection: Invalid targetStage provided for correction: ${targetStage}`);
            throw new Error(`Invalid target stage for correction: ${targetStage}`);
        }
        updates.stage = targetStage;
        console.log(`requestCorrection: Moving order ${orderId} back to stage: ${targetStage}`);
    } else {
        // If no target stage, ensure it remains in final_review but needs correction
        updates.stage = 'final_review';
    }


    await updateOrder(orderId, updates);

    console.log(`requestCorrection: Correction requested for order ${orderId}. Assembly status set to 'needs_correction'.`);
    return Promise.resolve();
};

// --- New Function for Delivery Stage ---

/**
 * Simulates delivering the order (e.g., sending an email) and updates the order status/stage.
 * @param orderId The ID of the order to deliver.
 * @param method The delivery method used (e.g., 'email').
 * @returns {Promise<void>} A promise that resolves when the delivery is simulated and order updated.
 * @throws {Error} Throws an error if the order is not found, not ready for delivery, or missing final story info.
 */
export const deliverOrder = async (orderId: string, method: 'email' | string = 'email'): Promise<void> => {
    console.log(`deliverOrder: Attempting to deliver MOCK order ${orderId} via ${method}.`);

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        console.error(`deliverOrder: MOCK Order ${orderId} not found.`);
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    const order = mockOrders[orderIndex];

    // Validate if the order is ready for delivery
    if (order.stage !== 'completed' || order.status !== 'completed') {
        console.error(`deliverOrder: Order ${orderId} is not in 'completed' stage/status (Current: ${order.stage}/${order.status}). Cannot deliver.`);
        throw new Error(`Order ${orderId} is not ready for delivery.`);
    }
    if (!order.finalStory || order.finalStory.assemblyStatus !== 'approved' || !order.finalStory.pdfUrl || order.finalStory.pdfUrl === '#') {
        console.error(`deliverOrder: Order ${orderId} has missing or unapproved final story data (PDF URL: ${order.finalStory?.pdfUrl}, Status: ${order.finalStory?.assemblyStatus}). Cannot deliver.`);
        throw new Error(`Order ${orderId} does not have an approved final story PDF to deliver.`);
    }

    // Simulate sending the email/delivery action
    console.log(`deliverOrder: Simulating sending delivery notification for order ${orderId} to ${order.email} with link ${order.finalStory.pdfUrl}...`);
    await delay(EMAIL_SEND_DELAY_MS);
    console.log(`deliverOrder: Mock delivery successful for order ${orderId}.`);

    // Update order with delivery information
    const deliveryTimestamp = createMockTimestamp(new Date());
    const deliveryInfo: DeliveryInfo = {
        method: method,
        deliveredAt: deliveryTimestamp as any, // Cast needed due to mock type mismatch potential
        downloadLink: order.finalStory.pdfUrl,
    };

    const updates: Partial<Order> = {
        status: 'delivered',
        stage: 'delivered',
        deliveryInfo: deliveryInfo,
        updatedAt: deliveryTimestamp as any, // Cast needed due to mock type mismatch potential
    };

    await updateOrder(orderId, updates);

    console.log(`deliverOrder: Order ${orderId} marked as delivered.`);
    return Promise.resolve();
};



// --- Existing Functions (AddOrder etc.) ---

/**
 * Adds a new order to the mock data store. Initializes with the character sheet stage.
 * @param orderData The data for the new order (excluding id, createdAt, updatedAt).
 * @returns {Promise<string>} A promise that resolves with the ID of the newly created mock order.
 */
export const addOrder = async (orderData: Omit<OrderData, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'attachments' | 'storyPages' | 'stage' | 'finalStory' | 'deliveryInfo' | 'characterSheet'> & { attachments?: Attachment[] }): Promise<string> => {
    console.log("addOrder: Adding new MOCK order...", orderData);
    await delay(SIMULATED_DELAY_MS);

    const newOrderId = `mock${String(mockOrders.length + 1).padStart(3, '0')}`;
    const now = new Date();

    // Initialize Character Sheet Data
    const photoAttachment = orderData.attachments?.find(att => att.name.match(/\.(jpg|jpeg|png|webp)$/i));
    const initialPrompt = DEFAULT_CHARACTER_SHEET_PROMPT
        .replace("[CHILD_NAME]", orderData.customerName || "Character") // Use customer name as default child name
        .replace("[SKIN_TONE]", "default") // Placeholder, should ideally be extracted or asked
        .replace("[HAIR_COLOR]", "default") // Placeholder
        .replace("[EYE_COLOR]", "default") // Placeholder
        .replace("[UPLOADED_PHOTO_URL]", photoAttachment?.url || ''); // Use uploaded photo URL or empty string

    const initialCharacterSheet: CharacterSheet = {
        prompt: initialPrompt,
        status: 'pending',
        imageUrl: undefined,
    };

    const newOrder: Order = {
        id: newOrderId,
        customerName: orderData.customerName,
        email: orderData.email,
        orderSummary: orderData.orderSummary,
        status: 'in_progress', // Start directly in progress
        stage: 'character_sheet_generation', // Start at the character sheet stage
        createdAt: createMockTimestamp(now) as any, // Cast needed
        updatedAt: createMockTimestamp(now) as any, // Cast needed
        storyType: orderData.storyType,
        language: orderData.language,
        specialRequests: orderData.specialRequests,
        attachments: orderData.attachments, // Use provided attachments or undefined
        characterSheet: initialCharacterSheet, // Add initialized character sheet
        storyPages: undefined, // Pages initialized after character sheet acceptance
        finalStory: undefined, // Initially no final story data
        deliveryInfo: undefined, // Initially no delivery info
    };

    mockOrders.push(newOrder);
    console.log(`addOrder: Successfully added MOCK order with ID ${newOrderId}. Total orders: ${mockOrders.length}`);
    return Promise.resolve(newOrderId);
};

// --- NEW Functions for Character Sheet Stage ---

/**
 * Simulates initiating MidJourney generation for the character sheet.
 * @param orderId The ID of the order.
 * @param prompt The prompt to use for generation.
 * @returns {Promise<void>} Resolves when the mock webhook processing is complete.
 * @throws {Error} If the order is not found or not in the correct stage.
 */
export const generateCharacterSheet = async (
    orderId: string,
    prompt: string
): Promise<void> => {
    console.log(`generateCharacterSheet: Initiating generation for MOCK order ${orderId}`);

    // 1. Find Order and Validate Stage
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone

    if (order.stage !== 'character_sheet_generation') {
        throw new Error(`Cannot generate character sheet for order ${orderId}, not in 'character_sheet_generation' stage.`);
    }

    // 2. Update Status to Regenerating (using 'pending' for simplicity, UI will show loading)
    const updatedCharacterSheet: CharacterSheet = {
        ...(order.characterSheet || { prompt: prompt, status: 'pending' }), // Ensure object exists
        prompt: prompt, // Update prompt just in case it changed
        status: 'pending', // Keep pending, UI handles loading state based on mutation status
        imageUrl: undefined, // Clear old image
    };
    order.characterSheet = updatedCharacterSheet;
    // Persist the prompt update and clear image URL
    await updateOrder(orderId, { characterSheet: order.characterSheet });
    console.log(`generateCharacterSheet: Order ${orderId} status updated. Simulating API call...`);

    // 3. Simulate MidJourney API Call
    // TODO: Replace with actual API call to Piapi
    console.log(`generateCharacterSheet: MOCKING API call with prompt: "${prompt}"`);
    await delay(API_CALL_DELAY_MS);
    console.log(`generateCharacterSheet: Mock API call for ${orderId} successful. Waiting for mock webhook...`);

    // 4. Simulate Webhook Delay and Response
    await delay(CHARACTER_SHEET_GENERATION_DELAY_MS); // Use character sheet delay
    const mockImageUrl = `https://picsum.photos/seed/${orderId}-charSheet${Date.now()}/600/600`;
    console.log(`generateCharacterSheet: Mock webhook received for ${orderId}. Image URL: ${mockImageUrl}`);

    // 5. Update Order with Image URL
    const currentOrderData = await getOrderById(orderId); // Refetch latest
    if (!currentOrderData) {
        console.error(`generateCharacterSheet: Order ${orderId} vanished during webhook delay!`);
        return;
    }
    const finalCharacterSheet: CharacterSheet = {
        ...(currentOrderData.characterSheet || { prompt: prompt, status: 'pending' }),
        imageUrl: mockImageUrl,
        status: 'pending', // Still pending review
    };
    await updateOrder(orderId, { characterSheet: finalCharacterSheet });

    console.log(`generateCharacterSheet: Updated order ${orderId} with character sheet image URL. Status is 'pending' review.`);
    return Promise.resolve();
};

/**
 * Accepts the generated character sheet and moves the order to the next stage.
 * @param orderId The ID of the order.
 * @returns {Promise<void>} Resolves when the update is complete.
 * @throws {Error} If the order, character sheet, or image URL is missing or not pending.
 */
export const acceptCharacterSheet = async (orderId: string): Promise<void> => {
    console.log(`acceptCharacterSheet: Accepting character sheet for MOCK order ${orderId}`);
    await delay(SIMULATED_DELAY_MS / 3);

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error(`Order ${orderId} not found.`);
    let order = { ...mockOrders[orderIndex] }; // Clone

    if (order.stage !== 'character_sheet_generation') {
        throw new Error(`Cannot accept character sheet for order ${orderId}, not in 'character_sheet_generation' stage.`);
    }
    if (!order.characterSheet || order.characterSheet.status !== 'pending') {
        throw new Error(`Character sheet for order ${orderId} is not pending review.`);
    }
    if (!order.characterSheet.imageUrl) {
        throw new Error(`Character sheet image URL is missing for order ${orderId}. Cannot accept.`);
    }

    // Update character sheet status
    const acceptedCharacterSheet: CharacterSheet = {
        ...order.characterSheet,
        status: 'accepted',
    };

    // Initialize empty story pages if they don't exist
    let initialStoryPages: StoryPage[] = order.storyPages || [];
    if (!initialStoryPages || initialStoryPages.length === 0) {
        const totalPagesToCreate = 5; // Default number of pages
        initialStoryPages = Array.from({ length: totalPagesToCreate }, (_, i) => ({
            pageNumber: i + 1,
            text: "", // Start empty
            textStatus: 'pending',
            midjourneyPrompt: undefined,
            promptStatus: undefined,
            illustrationImageUrl: undefined,
            compositeImageUrl: undefined,
            imageStatus: undefined,
        }));
        console.log(`acceptCharacterSheet: Initialized ${totalPagesToCreate} story pages for order ${orderId}.`);
    }


    // Prepare updates: set character sheet status, update stage, initialize pages
    const updates: Partial<Order> = {
        characterSheet: acceptedCharacterSheet,
        stage: 'story_content_generation',
        storyPages: initialStoryPages,
    };

    await updateOrder(orderId, updates);

    console.log(`acceptCharacterSheet: Character sheet accepted for order ${orderId}. Order moved to 'story_content_generation' stage.`);
    return Promise.resolve();
};


// --- Helper Functions ---

// Helper to check if all prompts exist for a given order's story pages (for enabling image gen)
const checkAllPromptsExist = (pages?: StoryPage[]): boolean => {
    if (!pages || pages.length === 0) return false;
    return pages.every(p => !!p.midjourneyPrompt);
};
