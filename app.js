const panels = {
  dashboardPanel: "Dashboard",
  uploadPanel: "Upload PDF",
  notesPanel: "AI Notes",
  flashcardsPanel: "Flashcards",
  quizPanel: "Quiz Center",
  chatPanel: "AI Chat",
  analyticsPanel: "Analytics",
  settingsPanel: "Settings",
};

const sampleText = `Photosynthesis is the process by which green plants convert light energy into chemical energy. Chlorophyll in the chloroplasts absorbs sunlight, especially blue and red light. During the light reactions, water molecules are split and oxygen is released. ATP and NADPH are produced during this stage. The Calvin cycle uses carbon dioxide, ATP, and NADPH to make glucose. Glucose stores energy that plants use for growth, repair, and survival. Photosynthesis is important because it provides food for plants and oxygen for animals. Factors such as light intensity, carbon dioxide concentration, temperature, and water availability can affect the rate of photosynthesis.`;

const stopWords = new Set([
  "and", "are", "but", "can", "for", "has", "its", "not", "the", "was",
  "about", "after", "again", "also", "because", "before", "being", "between", "could", "during",
  "every", "from", "have", "into", "more", "most", "other", "over", "should", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "through", "using", "very",
  "were", "what", "when", "where", "which", "while", "with", "would", "your", "process", "important",
  "chapter", "section", "student", "students", "learn", "learning", "study", "material",
]);

let studyPack = loadStudyPack();
let flashcards = studyPack.flashcards;
let questions = studyPack.quiz;
let currentCard = 0;
let currentQuestion = 0;
let score = 0;
let answered = false;
let inkAnimationId = null;
let introAnimationId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function emptyStudyPack() {
  return {
    title: "New Study Pack",
    sourceText: "",
    summary: "Upload or paste study material to generate your learning workspace.",
    notes: ["Upload or paste study material to generate structured notes."],
    concepts: [],
    flashcards: [
      {
        question: "Upload content first",
        answer: "Your generated answer will appear here.",
      },
    ],
    quiz: [
      {
        prompt: "Upload material to generate a quiz question.",
        options: ["Ready", "Upload", "Study", "Review"],
        answer: "Upload",
        feedback: "Add your own content to unlock real questions.",
      },
    ],
    explanations: {
      simple: "Upload content and NeuroNote will simplify the hardest idea in easy language.",
      detail: "Once you add study material, this area becomes a step-by-step explanation.",
      example: "Real-world examples will appear here after analysis.",
    },
    generatedAt: null,
  };
}

function loadStudyPack() {
  try {
    const saved = localStorage.getItem("neuronote.studyPack");
    return saved ? JSON.parse(saved) : emptyStudyPack();
  } catch {
    return emptyStudyPack();
  }
}

function saveStudyPack(pack) {
  localStorage.setItem("neuronote.studyPack", JSON.stringify(pack));
}

function setPanel(panelId) {
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.panel === panelId));
  $("#workspaceTitle").textContent = panels[panelId];

  if (panelId === "analyticsPanel") {
    drawAnalytics();
  }
}

function countUp() {
  $$("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    let value = 0;
    const step = Math.max(1, Math.round(target / 38));
    const timer = setInterval(() => {
      value = Math.min(target, value + step);
      node.textContent = value;
      if (value >= target) clearInterval(timer);
    }, 28);
  });
}

function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.12 }
  );

  $$(".reveal").forEach((node) => observer.observe(node));
}

function fillHeatmap() {
  const heatmap = $(".heatmap");
  if (!heatmap) return;
  heatmap.innerHTML = "";
  Array.from({ length: 70 }).forEach(() => {
    heatmap.appendChild(document.createElement("i"));
  });
}

function setupIntroAnimation() {
  const overlay = $("#introAnimation");
  const canvas = $("#introCanvas");
  if (!overlay || !canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let startTime = null;
  const duration = reducedMotion ? 1200 : 4400;

  document.body.classList.add("intro-lock");

  function resizeIntro() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function easeInOut(value) {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  function drawOrganicSphere(x, y, radius, time, color, alpha = 1, stretch = 1) {
    const gradient = ctx.createRadialGradient(
      x - radius * 0.28,
      y - radius * 0.32,
      radius * 0.08,
      x,
      y,
      radius * 1.18
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.68 * alpha})`);
    gradient.addColorStop(0.16, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.62 * alpha})`);
    gradient.addColorStop(0.62, `rgba(80, 65, 220, ${0.42 * alpha})`);
    gradient.addColorStop(1, `rgba(5, 5, 8, ${0.04 * alpha})`);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(stretch, 1);
    ctx.beginPath();
    const points = 96;
    for (let i = 0; i <= points; i += 1) {
      const angle = (Math.PI * 2 * i) / points;
      const wave =
        Math.sin(angle * 3 + time * 0.0024) * 0.055 +
        Math.sin(angle * 7 - time * 0.0017) * 0.035 +
        Math.sin(angle * 11 + time * 0.0011) * 0.018;
      const r = radius * (1 + wave);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.58 * alpha})`;
    ctx.shadowBlur = radius * 0.34;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const shine = ctx.createRadialGradient(
      x - radius * 0.34,
      y - radius * 0.38,
      0,
      x - radius * 0.34,
      y - radius * 0.38,
      radius * 0.46
    );
    shine.addColorStop(0, `rgba(255, 255, 255, ${0.36 * alpha})`);
    shine.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(x - radius * 0.34, y - radius * 0.38, radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawIntro(time) {
    if (startTime === null) startTime = time;
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.17;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `rgba(2, 3, 7, ${Math.max(0.18, 1 - progress * 0.72)})`;
    ctx.fillRect(0, 0, width, height);

    const breathe = Math.sin(elapsed * 0.004) * 0.04;
    const splitStart = reducedMotion ? 0.45 : 0.62;
    const splitProgress = Math.max(0, Math.min(1, (progress - splitStart) / 0.28));
    const split = easeInOut(splitProgress);
    overlay.style.background = `rgba(2, 3, 7, ${Math.max(0, 1 - split * 0.92)})`;
    const name = $(".intro-name");
    if (name) {
      name.style.opacity = progress > splitStart ? String(Math.max(0, 1 - splitProgress * 1.4)) : "1";
      name.style.transform = `translateY(${8 - split * 36}px) scale(${0.98 + split * 0.08})`;
    }

    if (splitProgress <= 0) {
      const appear = easeInOut(Math.min(progress / 0.22, 1));
      drawOrganicSphere(centerX, centerY, baseRadius * (0.62 + appear * 0.38 + breathe), elapsed, [94, 234, 212], appear);
    } else {
      const distance = split * (width * 0.42);
      const radius = baseRadius * (1 + split * 1.55);
      drawOrganicSphere(centerX - distance, centerY, radius, elapsed, [56, 189, 248], 1 - split * 0.15, 1 + split * 0.32);
      drawOrganicSphere(centerX + distance, centerY, radius, elapsed + 600, [168, 85, 247], 1 - split * 0.15, 1 + split * 0.32);

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const reveal = ctx.createLinearGradient(0, 0, width, 0);
      reveal.addColorStop(0, `rgba(0,0,0,${split})`);
      reveal.addColorStop(0.5, `rgba(0,0,0,${split * 0.35})`);
      reveal.addColorStop(1, `rgba(0,0,0,${split})`);
      ctx.fillStyle = reveal;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (progress < 1) {
      introAnimationId = requestAnimationFrame(drawIntro);
      return;
    }

    overlay.classList.add("done");
    document.body.classList.remove("intro-lock");
    window.removeEventListener("resize", resizeIntro);
    setTimeout(() => overlay.remove(), 950);
  }

  resizeIntro();
  window.addEventListener("resize", resizeIntro);
  cancelAnimationFrame(introAnimationId);
  introAnimationId = requestAnimationFrame(drawIntro);
}

function setupInkCanvas() {
  const canvas = $("#inkCanvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  const palette = [
    [56, 189, 248],
    [94, 234, 212],
    [168, 85, 247],
    [236, 72, 153],
  ];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let blobs = [];
  let pointer = { x: 0, y: 0, active: false };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = width < 720 ? 5 : 8;
    blobs = Array.from({ length: count }, (_, index) => {
      const color = palette[index % palette.length];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.28,
        radius: Math.min(width, height) * (0.16 + Math.random() * 0.08),
        color,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }

  function drawBlob(blob, time) {
    const pulse = Math.sin(time * 0.001 + blob.phase) * 18;
    const radius = blob.radius + pulse;
    const gradient = ctx.createRadialGradient(blob.x, blob.y, radius * 0.12, blob.x, blob.y, radius);
    const [r, g, b] = blob.color;
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.44)`);
    gradient.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, 0.24)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(14px) saturate(1.45) contrast(1.15)";

    blobs.forEach((blob) => {
      if (!reducedMotion) {
        blob.x += blob.vx;
        blob.y += blob.vy;

        if (pointer.active) {
          const dx = pointer.x - blob.x;
          const dy = pointer.y - blob.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < 340) {
            blob.x -= (dx / distance) * 0.34;
            blob.y -= (dy / distance) * 0.34;
          }
        }

        if (blob.x < -blob.radius) blob.x = width + blob.radius;
        if (blob.x > width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = height + blob.radius;
        if (blob.y > height + blob.radius) blob.y = -blob.radius;
      }

      drawBlob(blob, time);
    });

    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    const veil = ctx.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, "rgba(5, 5, 8, 0.16)");
    veil.addColorStop(0.55, "rgba(5, 5, 8, 0.62)");
    veil.addColorStop(1, "rgba(5, 5, 8, 0.82)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);

    inkAnimationId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY, active: true };
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  resize();
  cancelAnimationFrame(inkAnimationId);
  tick(0);
}

function normalizeText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();
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
  const keywordScore = keywords.reduce((total, word) => total + (lower.includes(word) ? 2 : 0), 0);
  const lengthScore = Math.min(sentence.length / 120, 2);
  return keywordScore + lengthScore;
}

function shorten(text, max = 130) {
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

function buildLocalStudyPack(sourceText, fileName = "Study Material") {
  const cleanText = normalizeText(sourceText);
  const sentences = splitSentences(cleanText);
  const keywords = getKeywords(cleanText, 10);
  const rankedSentences = [...sentences]
    .sort((a, b) => scoreSentence(b, keywords) - scoreSentence(a, keywords));
  const notes = rankedSentences.slice(0, 6);
  const fallbackNotes = cleanText
    .match(/.{80,180}(\s|$)/g)
    ?.slice(0, 5)
    .map((item) => item.trim()) || [];
  const finalNotes = notes.length ? notes : fallbackNotes;
  const concepts = keywords.map(titleCase);
  const title = fileName.replace(/\.[^.]+$/, "") || "Study Pack";
  const summary = finalNotes.slice(0, 3).join(" ");
  const hardestIdea = finalNotes[0] || cleanText.slice(0, 220);

  const generatedFlashcards = keywords.slice(0, 8).map((keyword, index) => {
    const sourceSentence =
      rankedSentences.find((sentence) => sentence.toLowerCase().includes(keyword)) ||
      finalNotes[index % Math.max(finalNotes.length, 1)] ||
      cleanText;

    return {
      question: `What should you remember about ${titleCase(keyword)}?`,
      answer: shorten(sourceSentence, 170),
    };
  });

  const generatedQuiz = finalNotes.slice(0, 5).map((note, index) => {
    const answer = concepts[index % Math.max(concepts.length, 1)] || "Main Concept";
    const wrongOptions = concepts
      .filter((concept) => concept !== answer)
      .slice(0, 3);
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
    summary: summary || "Your study pack is ready.",
    notes: finalNotes.length ? finalNotes : ["Add more text to generate stronger notes."],
    concepts,
    flashcards: generatedFlashcards.length
      ? generatedFlashcards
      : [{ question: "What is the main idea?", answer: cleanText.slice(0, 180) || "Add content first." }],
    quiz: generatedQuiz.length
      ? generatedQuiz
      : [{
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

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function analyzeWithServer(sourceText, fileName) {
  if (location.protocol === "file:") return null;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText, fileName }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function applyStudyPack(pack) {
  studyPack = pack;
  flashcards = pack.flashcards;
  questions = pack.quiz;
  currentCard = 0;
  currentQuestion = 0;
  score = 0;
  answered = false;
  saveStudyPack(pack);

  $("#notesTitle").textContent = `AI Notes - ${pack.title}`;
  $("#notesStatus").textContent = pack.generatedAt ? "Generated" : "Waiting";
  $("#noteList").innerHTML = "";
  pack.notes.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    $("#noteList").appendChild(item);
  });

  $("#keyConcepts").innerHTML = "";
  pack.concepts.slice(0, 10).forEach((concept) => {
    const item = document.createElement("span");
    item.textContent = concept;
    $("#keyConcepts").appendChild(item);
  });

  $("#explainText").textContent = pack.explanations.simple;
  $("#quizTitle").textContent = `${pack.title} Quiz`;
  $("#quizMeta").textContent = `${pack.quiz.length} questions · generated from your content`;
  $("#sourceText").value = pack.sourceText || $("#sourceText").value;

  updateFlashcard();
  renderQuestion();
  resetChat(pack);
  drawAnalytics();
}

function resetChat(pack) {
  $("#chatLog").innerHTML = "";
  appendMessage(`Study pack loaded: ${pack.title}. Ask me for a summary, quiz help, key concepts, or explanations from your material.`, "ai");
}

function setProcessing(message, visible = true) {
  const card = $("#processingCard");
  const text = $("#processingText");
  card.classList.toggle("hidden", !visible);
  text.textContent = message;
}

async function extractFileText(file) {
  $("#fileName").textContent = file.name;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    if (!window.pdfjsLib) {
      throw new Error("PDF reader could not load. Paste text instead or check your internet connection.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }

    return pages.join("\n\n");
  }

  return await file.text();
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    setProcessing("Reading your file...", true);
    const text = await extractFileText(file);
    $("#sourceText").value = normalizeText(text);
    setProcessing("File loaded. Click Generate Study Pack to analyze it.", true);
  } catch (error) {
    setProcessing(error.message, true);
  }
}

async function generateStudyPack() {
  const sourceText = normalizeText($("#sourceText").value);
  const fileName = $("#fileName").textContent === "No file selected" ? "Study Material" : $("#fileName").textContent;

  if (sourceText.length < 80) {
    setProcessing("Add more content first. Paste at least a paragraph or upload a PDF/text file.", true);
    setPanel("uploadPanel");
    return;
  }

  setProcessing("Analyzing concepts, summaries, questions, and flashcards...", true);

  const serverPack = await analyzeWithServer(sourceText, fileName);
  const pack = serverPack || buildLocalStudyPack(sourceText, fileName);

  setProcessing("Study pack ready. Opening AI notes...", true);
  applyStudyPack(pack);
  setTimeout(() => setPanel("notesPanel"), 450);
}

function updateFlashcard() {
  const card = flashcards[currentCard] || emptyStudyPack().flashcards[0];
  $("#studyCard").classList.remove("flipped");
  $("#flashQuestion").textContent = card.question;
  $("#flashAnswer").textContent = card.answer;
  $("#flashCounter").textContent = `${currentCard + 1} / ${flashcards.length} · Tap to flip`;
}

function renderQuestion() {
  const question = questions[currentQuestion] || emptyStudyPack().quiz[0];
  const grid = $("#answerGrid");
  answered = false;
  $("#quizQuestion").textContent = question.prompt;
  $("#quizFeedback").textContent = "Choose an answer to get instant feedback.";
  $("#quizProgress").style.width = `${(currentQuestion / questions.length) * 100}%`;
  $("#quizScore").textContent = `${score} / ${questions.length}`;
  grid.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => chooseAnswer(button, option));
    grid.appendChild(button);
  });
}

function chooseAnswer(button, option) {
  if (answered) return;
  answered = true;
  const question = questions[currentQuestion];
  const isCorrect = option === question.answer;
  if (isCorrect) score += 1;

  $$("#answerGrid button").forEach((answer) => {
    if (answer.textContent === question.answer) answer.classList.add("correct");
  });
  if (!isCorrect) button.classList.add("wrong");

  $("#quizFeedback").textContent = isCorrect
    ? question.feedback
    : `Close. The answer is ${question.answer}. ${question.feedback}`;
  $("#quizScore").textContent = `${score} / ${questions.length}`;
  $("#quizProgress").style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
}

function nextQuestion() {
  currentQuestion = (currentQuestion + 1) % questions.length;
  if (currentQuestion === 0) score = 0;
  renderQuestion();
}

function answerFromMaterial(query) {
  const lowerQuery = query.toLowerCase();

  if (!studyPack.sourceText) {
    return "Upload or paste study material first, then I can answer from it.";
  }

  if (lowerQuery.includes("summary") || lowerQuery.includes("summarize")) {
    return studyPack.summary;
  }

  if (lowerQuery.includes("question") || lowerQuery.includes("quiz")) {
    return studyPack.quiz
      .slice(0, 4)
      .map((item, index) => `${index + 1}. ${item.prompt}`)
      .join(" ");
  }

  if (lowerQuery.includes("concept") || lowerQuery.includes("important")) {
    return `Key concepts: ${studyPack.concepts.slice(0, 8).join(", ")}.`;
  }

  if (lowerQuery.includes("simple") || lowerQuery.includes("explain")) {
    return studyPack.explanations.simple;
  }

  const queryWords = wordsFrom(query).filter((word) => !stopWords.has(word));
  const sentences = splitSentences(studyPack.sourceText);
  const best = sentences
    .map((sentence) => ({
      sentence,
      score: queryWords.reduce((total, word) => total + (sentence.toLowerCase().includes(word) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  return best?.score
    ? shorten(best.sentence, 260)
    : "I could not find a direct match, but the main summary is: " + studyPack.summary;
}

function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;

  appendMessage(value, "user");
  input.value = "";

  setTimeout(() => {
    appendMessage(answerFromMaterial(value), "ai");
  }, 260);
}

function appendMessage(text, type) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  $("#chatLog").appendChild(node);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

function drawAnalytics() {
  const canvas = $("#analyticsCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const base = studyPack.generatedAt ? Math.min(studyPack.notes.length * 12, 78) : 38;
  const values = [base - 18, base - 6, base - 12, base + 2, base + 9, base + 14, Math.min(base + 18, 96)]
    .map((value) => Math.max(20, Math.min(100, value)));
  const width = canvas.width;
  const height = canvas.height;
  const pad = 34;
  const max = 100;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 5; i += 1) {
    const y = pad + (i * (height - pad * 2)) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  const points = values.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (values.length - 1);
    const y = height - pad - (value / max) * (height - pad * 2);
    return [x, y];
  });

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#5eead4");
  gradient.addColorStop(0.5, "#38bdf8");
  gradient.addColorStop(1, "#a855f7");

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.fillStyle = "#050508";
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 4;
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function wireEvents() {
  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => setPanel(item.dataset.panel));
  });

  $("#openApp").addEventListener("click", () => {
    document.querySelector("#app").scrollIntoView({ behavior: "smooth" });
    setPanel("uploadPanel");
  });

  $("#pdfInput").addEventListener("change", handleFileUpload);
  $("#generateStudyPack").addEventListener("click", generateStudyPack);
  $("#loadSample").addEventListener("click", () => {
    $("#sourceText").value = sampleText;
    $("#fileName").textContent = "sample-biology-chapter.txt";
    setProcessing("Sample text loaded. Click Generate Study Pack.", true);
  });

  $("#studyCard").addEventListener("click", () => $("#studyCard").classList.toggle("flipped"));
  $("#nextCard").addEventListener("click", () => {
    currentCard = (currentCard + 1) % flashcards.length;
    updateFlashcard();
  });
  $("#prevCard").addEventListener("click", () => {
    currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
    updateFlashcard();
  });

  $$(".chip[data-explain]").forEach((button) => {
    button.addEventListener("click", () => {
      $("#explainText").textContent = studyPack.explanations[button.dataset.explain];
    });
  });

  $("#nextQuestion").addEventListener("click", nextQuestion);
  $("#chatForm").addEventListener("submit", sendChat);
  window.addEventListener("resize", drawAnalytics);
}

document.addEventListener("DOMContentLoaded", () => {
  setupIntroAnimation();
  setupInkCanvas();
  revealOnScroll();
  countUp();
  fillHeatmap();
  applyStudyPack(studyPack);
  drawAnalytics();
  wireEvents();
});
