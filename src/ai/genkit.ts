
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * IMPORTANT FOR PRODUCTION:
 * The Google AI API key (for Gemini) should be configured securely in your server environment.
 * Typically, this is done by setting the GOOGLE_API_KEY environment variable where your
 * Genkit flows/Next.js server is deployed.
 *
 * DO NOT hardcode API keys in your frontend or commit them to your repository.
 * The client-side API key input form in Settings has been removed for security reasons.
 * Genkit's googleAI() plugin will automatically look for this environment variable.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
