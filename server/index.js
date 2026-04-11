const express = require("express");
const cors = require("cors");
require("dotenv").config();

if (!process.env.GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY environment variable");
  process.exit(1);
}

if (!process.env.FRONTEND_URL) {
  console.warn(
    "⚠️  FRONTEND_URL is not set. CORS may be too permissive in production.",
  );
}

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://moodistic-omega.vercel.app",     
  "https://moodistic.vercel.app",           
  process.env.FRONTEND_URL,                 
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.options("*", cors());

app.use(express.json({ limit: "10mb" }));


app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

app.set("trust proxy", 1);

app.get("/", (_, res) => {
  res.send("Moodistic API is running");
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.post("/api/analyze-mood-honesty", async (req, res) => {
  const { entries } = req.body;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "Missing or invalid entries array" });
  }

  
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (!app.locals.moodAnalysisRateLimits) app.locals.moodAnalysisRateLimits = new Map();
  const limits = app.locals.moodAnalysisRateLimits;

  let userLimit = limits.get(ip);

  if (!userLimit || now > userLimit.resetAt) {
    userLimit = { count: 0, resetAt: now + oneDayMs };
    limits.set(ip, userLimit);
  }

  userLimit.count++;
  limits.set(ip, userLimit);

  if (userLimit.count > 50) {   
    return res.status(429).json({ 
      error: "Too many analysis requests. Please try again later." 
    });
  }

  try {
    const makeRequest = async (retryCount = 0) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              max_tokens: 300,
              temperature: 0.7,
              messages: [
                {
                  role: "system",
                  content: `You are a mood honesty analyzer.
For each journal entry, analyze if the reported mood_score (1-5) matches the emotional tone of the text.
Return ONLY valid JSON array like this:
[
  {"index": 0, "result": "masked"},
  {"index": 1, "result": "honest"},
  {"index": 2, "result": "reverse_masked"}
]
Where:
- "masked" = user reported high mood but text is negative
- "reverse_masked" = user reported low mood but text is positive
- "honest" = matches well

Support English, Hindi, Marathi.`,
                },
                {
                  role: "user",
                  content: JSON.stringify(
                    entries.map((e, i) => ({
                      index: i,
                      content: e.content,
                      mood_score: e.mood_score,
                    })),
                  ),
                },
              ],
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);
        const data = await response.json();

        if (response.status === 429 && retryCount < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          return makeRequest(retryCount + 1);
        }

        if (!response.ok) throw new Error(data.error?.message || "Groq error");

        const resultText = data.choices[0].message.content;
        return JSON.parse(resultText);
      } catch (err) {
        clearTimeout(timeout);
        if (
          (err.name === "AbortError" || err.message.includes("fetch")) &&
          retryCount < 2
        ) {
          await new Promise((r) => setTimeout(r, 1500));
          return makeRequest(retryCount + 1);
        }
        throw err;
      }
    };

    const analysis = await makeRequest();

    return res.json({ analysis });
  } catch (err) {
    console.error("Mood honesty batch error:", err);

    return res.json({
      analysis: entries.map((_, i) => ({ index: i, result: "honest" })),
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !systemPrompt) {
    return res.status(400).json({ error: "Missing messages or systemPrompt" });
  }

    // Daily rate limiting for chat (20 messages per day)
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (!app.locals.chatRateLimits) app.locals.chatRateLimits = new Map();
  const limits = app.locals.chatRateLimits;

  let userLimit = limits.get(ip);

  if (!userLimit || now > userLimit.resetAt) {
    userLimit = { count: 0, resetAt: now + oneDayMs };
    limits.set(ip, userLimit);
  }

  userLimit.count++;
  limits.set(ip, userLimit);

  if (userLimit.count > 20) {
    return res.status(429).json({ 
      error: "You've reached your daily limit of 20 messages. Come back tomorrow 🌱" 
    });
  }

  try {
    const makeRequest = async (retryCount = 0) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              max_tokens: 200,
              temperature: 0.8,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages,
              ],
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);

        const data = await response.json();

        if (response.status === 429 && retryCount < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          return makeRequest(retryCount + 1);
        }

        if (!response.ok) {
          throw new Error(data.error?.message || "Groq error");
        }

        return data.choices[0].message.content;
      } catch (err) {
        clearTimeout(timeout);

        if (
          (err.name === "AbortError" || err.message.includes("fetch")) &&
          retryCount < 2
        ) {
          await new Promise((r) => setTimeout(r, 1500));
          return makeRequest(retryCount + 1);
        }

        throw err;
      }
    };

    const result = await makeRequest();

    const delay = Math.min(2500, 500 + result.length * 10);
    await new Promise((r) => setTimeout(r, delay));

    return res.json({
      content: result,
      thinking: false,
    });
  } catch (err) {
    console.error("Final Error:", err);

    return res.status(200).json({
      content:
        "hmm... something felt a bit off just now. want to try that again?",
      thinking: false,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Moodistic server running on port ${PORT}`));
