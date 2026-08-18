import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = () => {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
};

export async function sendChatMessage(message: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "Gemini API Key is not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `You are VertEase AI, a compassionate, expert medical assistant specializing in vertigo, balance disorders, vestibular rehabilitation, BPPV, Meniere's disease, and vestibular migraine. 
Provide clear, reassuring, and evidence-based guidance to both patients and healthcare practitioners. 
Keep responses well-structured, clear, concise, and helpful. Always emphasize consulting a medical professional for severe or sudden neurological symptoms.`;

  // Models list in order of preference
  const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash', 'gemini-flash', 'gemini-1.5-pro-latest'];

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `${systemInstruction}\n\nUser Question: ${message}`;
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      if (text) return text;
    } catch (error: any) {
      console.warn(`Model ${modelName} attempt:`, error?.message || String(error));
    }
  }

  return "I'm having trouble connecting to the AI assistant right now. Please verify your Gemini API key project quota or try again in a moment.";
}