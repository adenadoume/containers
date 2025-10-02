// API Route: /api/ai/parse-email.ts
// This is a Vercel Serverless Function

import { Configuration, OpenAIApi } from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailContent, containerName } = req.body;

    if (!emailContent) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    // Prepare the AI prompt
    const systemPrompt = `You are an expert at extracting shipping and supplier information from emails. 
Extract the following fields and return them as a JSON object:
- supplier: Company name of the supplier
- product: Product description
- cbm: Cubic meters (as a number)
- cartons: Number of cartons (as a number)
- grossWeight: Gross weight (as a number)
- productCost: Product cost in USD (as a number)
- freightCost: Freight cost in USD (as a number)
- client: Client/customer name
- referenceCode: Any reference or order number
- status: One of: "Ready to Ship", "Awaiting Supplier", "Need Payment", "Pending"
- awaiting: What is being awaited (Payment, Certificates, Documents, Inspection, or "-")

If any field is not mentioned in the email, set it to null or 0 for numbers.
Return ONLY valid JSON, no explanations.`;

    const userPrompt = `Extract shipping information from this email:\n\n${emailContent}`;

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4', // or 'gpt-3.5-turbo' for lower cost
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 500,
    });

    const responseText = completion.data.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const extractedData = JSON.parse(responseText);

    // Return the extracted data
    return res.status(200).json({
      success: true,
      data: extractedData,
      rawResponse: responseText,
    });

  } catch (error: any) {
    console.error('AI parsing error:', error);
    return res.status(500).json({
      error: 'Failed to parse email',
      message: error.message,
    });
  }
}

