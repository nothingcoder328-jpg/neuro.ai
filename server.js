const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const root = __dirname;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const stopWords = new Set([
  "and", "are", "but", "can", "for", "has", "its", "not", "the", "was",
  "about", "after", "again", "also", "because", "before", "being", "between", "could", "during",
  "every", "from", "have", "into", "more", "most", "other", "over", "should", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "through", "using", "very",
  "were", "what", "when", "where", "which", "while", "with", "would", "your", "process", "important",
  "chapter", "section", "student", "students", "learn", "learning", "study", "material",
]);

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35)
    .slice(0, 80);
}

function wordsFrom(text) {
  return normalizeText(text).toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shorten(text, max = 130) {
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

function getKeywords(text, limit = 10) {
  const counts = new Map();
  wordsFrom(text).forEach((word) => {
    if (stopWords.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function scoreSentence(sentence, keywords) {
  const lower = sentence.toLowerCase();
  return keywords.reduce((total, word) => total + (lower.includes(word) ? 2 : 0), 0) + Math.min(sentence.length / 120, 2);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildStudyPack(sourceText, fileName = "Study Material") {
  const cleanText = normalizeText(sourceText);
  const sentences = splitSentences(cleanText);
  const keywords = getKeywords(cleanText, 10);
  const rankedSentences = [...sentences].sort((a, b) => scoreSentence(b, keywords) - scoreSentence(a, keywords));
  const notes = rankedSentences.slice(0, 6);
  const fallbackNotes = cleanText.match(/.{80,180}(\s|$)/g)?.slice(0, 5).map((item) => item.trim()) || [];
  const finalNotes = notes.length ? notes : fallbackNotes;
  const concepts = keywords.map(titleCase);
  const title = fileName.replace(/\.[^.]+$/, "") || "Study Pack";
  const hardestIdea = finalNotes[0] || cleanText.slice(0, 220);

  const flashcards = keywords.slice(0, 8).map((keyword, index) => {
    const sourceSentence =
      rankedSentences.find((sentence) => sentence.toLowerCase().includes(keyword)) ||
      finalNotes[index % Math.max(finalNotes.length, 1)] ||
      cleanText;

    return {
      question: `What should you remember about ${titleCase(keyword)}?`,
      answer: shorten(sourceSentence, 170),
    };
  });

  const quiz = finalNotes.slice(0, 5).map((note, index) => {
    const answer = concepts[index % Math.max(concepts.length, 1)] || "Main Concept";
    const wrongOptions = concepts.filter((concept) => concept !== answer).slice(0, 3);
    while (wrongOptions.length < 3) {
      wrongOptions.push(["Definition", "Example", "Formula", "Timeline"][wrongOptions.length]);
    }

    return {
      prompt: `Which concept best matches this idea: "${shorten(note, 92)}"?`,
      options: shuffle([answer, ...wrongOptions]).slice(0, 4),
      answer,
      feedback: `This question is based on: ${shorten(note, 140)}`,
    };
  });

  return {
    title,
    sourceText: cleanText,
    summary: finalNotes.slice(0, 3).join(" ") || "Your study pack is ready.",
    notes: finalNotes.length ? finalNotes : ["Add more text to generate stronger notes."],
    concepts,
    flashcards: flashcards.length ? flashcards : [{ question: "What is the main idea?", answer: shorten(cleanText, 180) }],
    quiz: quiz.length ? quiz : [{
      prompt: "What is the main purpose of this material?",
      options: ["Understand the topic", "Ignore the topic", "Delete the notes", "Skip revision"],
      answer: "Understand the topic",
      feedback: "The pack needs a little more text for deeper quiz generation.",
    }],
    explanations: {
      simple: `In simple words: ${shorten(hardestIdea, 210)}`,
      detail: `Step by step: first identify the main concept, then connect it to the supporting facts. The key idea is: ${shorten(hardestIdea, 230)}`,
      example: `Real-world example: imagine teaching this to a friend using one clear example. You would start with: ${shorten(hardestIdea, 190)}`,
    },
    generatedAt: new Date().toISOString(),
  };
}

function extractResponseText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function buildAiStudyPack(sourceText, fileName = "Study Material") {
  if (!process.env.OPENAI_API_KEY) return null;

  const title = fileName.replace(/\.[^.]+$/, "") || "Study Pack";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input:
        "You are NeuroNote AI, an expert student tutor. Create accurate study notes, quiz questions, flashcards, and beginner-friendly explanations only from the supplied study material. Return 4 to 8 notes, 4 to 10 concepts, 4 to 8 flashcards, and 4 to 6 quiz questions. Every quiz question must have exactly 4 options, and the answer must exactly match one option.\n\n" +
        `Study pack title: ${title}\n\nStudy material:\n${sourceText.slice(0, 18000)}`,
      text: {
        format: {
          type: "json_schema",
          name: "study_pack",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "notes", "concepts", "flashcards", "quiz", "explanations"],
            properties: {
              summary: { type: "string" },
              notes: {
                type: "array",
                items: { type: "string" },
              },
              concepts: {
                type: "array",
                items: { type: "string" },
              },
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["question", "answer"],
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                },
              },
              quiz: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["prompt", "options", "answer", "feedback"],
                  properties: {
                    prompt: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                    },
                    answer: { type: "string" },
                    feedback: { type: "string" },
                  },
                },
              },
              explanations: {
                type: "object",
                additionalProperties: false,
                required: ["simple", "detail", "example"],
                properties: {
                  simple: { type: "string" },
                  detail: { type: "string" },
                  example: { type: "string" },
                },
              },
            },
          },
        },
      },
      max_output_tokens: 2600,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);
  const parsed = JSON.parse(text);

  return {
    title,
    sourceText,
    summary: parsed.summary,
    notes: parsed.notes,
    concepts: parsed.concepts,
    flashcards: parsed.flashcards,
    quiz: parsed.quiz,
    explanations: parsed.explanations,
    generatedAt: new Date().toISOString(),
    provider: "openai",
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_500_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  if (req.method === "POST" && urlPath === "/api/analyze") {
    try {
      const body = await readJsonBody(req);
      const sourceText = normalizeText(body.sourceText);

      if (sourceText.length < 80) {
        sendJson(res, 400, { error: "Add at least one paragraph of study material." });
        return;
      }

      let pack = null;
      try {
        pack = await buildAiStudyPack(sourceText, body.fileName || "Study Material");
      } catch (error) {
        console.error(error.message);
      }
      sendJson(res, 200, pack || buildStudyPack(sourceText, body.fileName || "Study Material"));
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  const filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(root, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": types[".html"] });
        res.end(fallback);
      });
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`NeuroNote AI running on port ${port}`);
});
