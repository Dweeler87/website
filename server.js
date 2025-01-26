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

// Serve static files from the "public_html" folder
app.use(express.static("public_html"));

// Handle chat requests
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    // Set headers for streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Call the Groq API with streaming enabled
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a chatbot agent with a personal injury law firm. You answer questions and collect information about people's injury cases. You need to have empathy, patience, and a little bit of personality to connect with people. I need to gather details about the accident, insurance, responsible party, medical treatments, medical assessments, medical follow-ups, and daily life impacts.",
        },
        { role: "user", content: message },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
    });

    // Process the streamed response
    const reader = chatCompletion.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk); // Send the chunk to the client
      }
    }

    res.end(); // End the streaming response
  } catch (error) {
    console.error("Error with Groq API:", error.message || error);

    // Handle errors gracefully
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error. Please try again later." });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
