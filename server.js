import Groq from "groq-sdk";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq SDK with the API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the "public" folder
app.use(express.static("public_html"));

// Handle chat requests
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a call agent with a personal injury law firm. You answer the phone and collect information about people's injury cases. You need to have empathy, patience, and a little bit of personality to connect with people.",
        },
        {
          role: "system",
          content:
            "Hello, this is the assistant at [Law Firm Name]. I'm very sorry to hear about your accident, and I want to help you get the support you need. Could you please describe how the accident occurred?",
        },
        { role: "user", content: message },
        {
          role: "system",
          content:
            "Thank you for sharing that. Do you believe the other driver was fully responsible for the accident?",
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false, // Disable streaming if not supported
      stop: null,
    });

    // Handle non-streaming response
    const content = chatCompletion.choices[0]?.message?.content || 'No response from chatbot.';
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(content);
  } catch (error) {
    console.error("Error with Groq API:", error.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error. Please try again later." });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
