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
            "Hello, this is Jennifer at Slip and Fall, LLP. I'm very sorry to hear about your accident, and I want to help you get the support you need. Could you please describe how the accident occurred?",
        },
        { role: "user", content: "The user explains how the accident occurred." },
        {
          role: "system",
          content:
            "Thank you for sharing that. Do you believe the other driver was fully responsible for the accident?",
        },
        { role: "user", content: "User's view on the other driver's responsibility." },
        {
          role: "system",
          content:
            "Did police respond to the accident? If so, which police agency was involved and have you obtained the police report?",
        },
        { role: "user", content: "User provides details about the police response." },
        {
          role: "system",
          content:
            "Was the at-fault driver driving a company or work vehicle at the time of the accident?",
        },
        { role: "user", content: "User answers about the at-fault driver’s vehicle status." },
        {
          role: "system",
          content:
            "Do you know if the at-fault driver was insured, and if so, who is their insurance carrier?",
        },
        { role: "user", content: "User provides insurance details if known." },
        {
          role: "system",
          content:
            "Were you experiencing any pain immediately at the scene of the accident?",
        },
        { role: "user", content: "User describes any immediate pain or injuries." },
        {
          role: "system",
          content:
            "What specific injuries did you sustain? Please take your time to explain.",
        },
        { role: "user", content: "User details their injuries." },
        {
          role: "system",
          content:
            "Have you received any medical treatment since the accident, such as visits to an emergency department or follow-ups with any specialists?",
        },
        { role: "user", content: "User talks about any medical treatments received." },
        {
          role: "system",
          content:
            "Managing medical expenses can be stressful. Have you received any medical bills to date, and do you have future treatment planned?",
        },
        { role: "user", content: "User provides information about medical bills and future treatments." },
        {
          role: "system",
          content:
            "Has this accident resulted in you losing any time from work? Also, are there hobbies or activities you enjoyed prior to this accident that you are now unable to participate in?",
        },
        { role: "user", content: "User discusses impact on work and personal life." },
        {
          role: "system",
          content:
            "Thank you for sharing all this information. A member of our team will review your responses and get in touch with you soon to discuss how we can assist further. Is there anything else you would like to add or any other way we can support you today?",
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true, // Disable streaming if not supported
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
