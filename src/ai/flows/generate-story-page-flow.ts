
'use server';
/**
 * @fileOverview Generates text for a single page of a children's story.
 *
 * - generateStoryPageText - A function that calls the story generation flow.
 * - GenerateStoryPageInput - The input type for the flow.
 * - GenerateStoryPageOutput - The return type for the flow.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the input schema for the story page generation flow - DO NOT EXPORT SCHEMA
const GenerateStoryPageInputSchema = z.object({
  orderSummary: z.string().describe('The overall summary or theme of the story.'),
  customerName: z.string().describe('The name of the main character or child the story is for.'),
  pageNumber: z.number().int().positive().describe('The current page number being generated.'),
  totalPages: z.number().int().positive().describe('The total number of pages planned for the story.'),
  storyType: z.string().optional().describe('The genre or type of story (e.g., Adventure, Learning).'),
  language: z.string().optional().default('English').describe('The language the story should be written in.'),
  specialRequests: z.string().optional().describe('Any specific elements or characters to include.'),
  previousPageText: z.string().optional().describe('The text content of the immediately preceding page, if available, for continuity.'),
});
// EXPORT ONLY THE TYPE
export type GenerateStoryPageInput = z.infer<typeof GenerateStoryPageInputSchema>;

// Define the output schema for the story page generation flow - DO NOT EXPORT SCHEMA
const GenerateStoryPageOutputSchema = z.object({
  generatedText: z.string().describe('The generated text content for the specified story page.'),
});
// EXPORT ONLY THE TYPE
export type GenerateStoryPageOutput = z.infer<typeof GenerateStoryPageOutputSchema>;

// Define the Genkit prompt for generating the story page text
const storyPagePrompt = ai.definePrompt({
  name: 'generateStoryPagePrompt',
  input: { schema: GenerateStoryPageInputSchema },
  output: { schema: GenerateStoryPageOutputSchema },
  prompt: `You are a creative and engaging children's story writer. Your task is to write the text for a specific page of a personalized storybook.

Story Details:
- Main Character/Recipient: {{{customerName}}}
- Overall Story Summary/Theme: {{{orderSummary}}}
- Story Type: {{{storyType}}}
- Target Language: {{{language}}}
{{#if specialRequests}}- Special Requests: {{{specialRequests}}}{{/if}}

Current Page Context:
- You are writing Page {{pageNumber}} of {{totalPages}}.
{{#if previousPageText}}- Text from Previous Page (Page {{subtract pageNumber 1}}): {{{previousPageText}}}{{/if}}

Instructions:
1. Write engaging and age-appropriate text for Page {{pageNumber}}.
2. Ensure the text logically follows the story summary and any text from the previous page (if provided).
3. Incorporate any special requests if relevant to this page.
4. Keep the tone consistent with the story type (e.g., adventurous, educational, whimsical).
5. Write only the text content for this single page. Do not add "Page X:" prefixes or any other meta-text.
6. Ensure the output is in {{language}}.

Generate the text for Page {{pageNumber}} now.`,
// Register Handlebars helper
  templateFormat: 'handlebars',
  model: ai.model, // Use the default model configured in ai-instance.ts
  config: {
      temperature: 0.8, // Adjust creativity level
  },
   // Add Handlebars helper for simple subtraction inline
  handlebarsHelpers: {
     subtract: (a: number, b: number) => a - b,
  },
});


// Define the Genkit flow
const generateStoryPageFlow = ai.defineFlow<
  typeof GenerateStoryPageInputSchema,
  typeof GenerateStoryPageOutputSchema
>(
  {
    name: 'generateStoryPageFlow',
    inputSchema: GenerateStoryPageInputSchema,
    outputSchema: GenerateStoryPageOutputSchema,
  },
  async (input) => {
    console.log("Executing generateStoryPageFlow with input:", input);
    const { output } = await storyPagePrompt(input);
    if (!output) {
        throw new Error("AI failed to generate story page text.");
    }
    console.log("generateStoryPageFlow output:", output);
    return output; // Output already matches the schema due to definePrompt definition
  }
);

// Exported async wrapper function to call the flow - THIS IS ALLOWED
export async function generateStoryPageText(input: GenerateStoryPageInput): Promise<GenerateStoryPageOutput> {
  return generateStoryPageFlow(input);
}
