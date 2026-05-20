import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for Gemini Retries
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    const isRetryable = 
      error.status === 503 || 
      error.code === 503 || 
      error.status === 429 ||
      error.code === 429 ||
      errorMsg.includes("429") ||
      errorMsg.includes("503") || 
      errorMsg.includes("UNAVAILABLE") || 
      errorMsg.includes("high demand") ||
      errorMsg.includes("overloaded") ||
      errorMsg.includes("quota exceeded") ||
      errorMsg.includes("Too Many Requests");

    if (retries > 0 && isRetryable) {
      console.log(`Gemini busy or rate limited (Status ${error.status || error.code}), retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff with a bit of jitter
      const nextDelay = delay * 2 + Math.random() * 1000;
      return callGeminiWithRetry(fn, retries - 1, nextDelay);
    }
    throw error;
  }
}

// AI Store Generator Endpoint
app.post("/api/ai/generate-store", async (req, res) => {
  try {
    const { productName, productCategory, description, image, mimeType } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const contents: any[] = [];
    
    let prompt = `You are a professional marketing expert for African SMEs. 
    Based on the following product info, generate:
    1. A catchy product name (if not provided).
    2. A professional description.
    3. A pricing strategy suggestion (in Naira).
    4. Relevant hashtags.
    5. A short WhatsApp status caption.`;

    if (image && mimeType) {
      prompt += `\n\nI have also provided a photo of the product. Please analyze it carefully to inform your suggestions.`;
      contents.push({
        role: "user",
        parts: [
          { inlineData: { data: image, mimeType: mimeType } },
          { text: `${prompt}\n\nProduct Name: ${productName}\nCategory: ${productCategory}\nDescription: ${description}` }
        ]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: `${prompt}\n\nProduct Name: ${productName}\nCategory: ${productCategory}\nDescription: ${description}` }]
      });
    }

    const apiCall = () => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedName: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedPrice: { type: Type.NUMBER },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatsappCaption: { type: Type.STRING }
          },
          required: ["suggestedName", "description", "suggestedPrice", "hashtags", "whatsappCaption"]
        }
      }
    });

    const response = await callGeminiWithRetry(apiCall);
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Store Error:", error);
    res.status(500).json({ error: "AI is currently busy. Please try again soon." });
  }
});

// AI Chat Assistant Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, inventoryData, analyticsData } = req.body;
    
    const apiCall = () => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map((m: any) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
      config: {
        systemInstruction: `You are "MarketMate", a smart business assistant for African artisans. Use this context:
        Inv: ${JSON.stringify(inventoryData)}
        Sales: ${JSON.stringify(analyticsData)}`
      }
    });

    const response = await callGeminiWithRetry(apiCall);
    res.json({ content: response.text });
  } catch (error) {
    res.json({ content: "Pẹlẹ o! My AI brain is a bit tired right now (High Demand). Please try again in 1 minute!" });
  }
});

// AI Business Insights Endpoint
app.post("/api/ai/insights", async (req, res) => {
  try {
    const { inventoryData, salesData } = req.body;
    
    const apiCall = () => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this data and provide 3 smart, actionable business insights:
    Inventory: ${JSON.stringify(inventoryData)}
    Sales: ${JSON.stringify(salesData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["insights"]
        }
      }
    });

    const response = await callGeminiWithRetry(apiCall);
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("AI Insights Error:", error);
    // Fallback static insights if AI fails
    res.json({ insights: [
      "Keep an eye on your restock levels this week.",
      "Check which items sell fastest on market days.",
      "Consider updating your WhatsApp status often."
    ]});
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
