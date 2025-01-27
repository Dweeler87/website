import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(bodyParser.json());
app.use(express.static("public_html"));

// In-memory storage for conversation history (per session or user ID)
const conversationHistory = {}; // Key: userId, Value: messages array

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { message, userId } = req.body;

  if (!message || !userId) {
    return res.status(400).json({ error: 'Message and userId are required.' });
  }

  // Initialize conversation history for the user if not already set
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [
      {
        role: "system",
        content:
          "You are a chatbot agent with a personal injury law firm. You answer questions and collect information about people's injury cases. You need to have empathy, patience, and a little bit of personality to connect with people. I need to gather details about the accident, insurance, responsible party, medical treatments, medical assessments, medical follow-ups, and daily life impacts. Keep your response concise and speak a 6th grade level.",
      },
    ];
  }

  try {
    // Add the user's message to the conversation history
    conversationHistory[userId].push({ role: "user", content: message });

    // Call the Groq API with the updated conversation history
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory[userId],
      model: 'llama-3.1-8b-instant',
      temperature: 1,
      max_completion_tokens: 1024,
    });

    const botResponse = chatCompletion.choices[0]?.message?.content || "No response from the chatbot.";
    console.log(`Bot response for user ${userId}: ${botResponse}`);

    // Add the bot's response to the conversation history
    conversationHistory[userId].push({ role: "assistant", content: botResponse });

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Error in /chat endpoint:", error.message || error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
