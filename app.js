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

const flashcards = [
  {
    question: "What is chlorophyll?",
    answer: "A green pigment that absorbs light energy for photosynthesis.",
  },
  {
    question: "Where do light reactions happen?",
    answer: "Inside the thylakoid membranes of chloroplasts.",
  },
  {
    question: "What does the Calvin cycle use?",
    answer: "Carbon dioxide, ATP, and NADPH to build sugar molecules.",
  },
];

const questions = [
  {
    prompt: "Which molecule stores energy made during light reactions?",
    options: ["ATP", "Oxygen", "Carbon dioxide", "Chlorophyll b"],
    answer: "ATP",
    feedback: "Correct. ATP stores short-term chemical energy for the Calvin cycle.",
  },
  {
    prompt: "True or false: plants only perform photosynthesis at night.",
    options: ["True", "False", "Only in winter", "Only underwater"],
    answer: "False",
    feedback: "Right. Photosynthesis depends on light, so it happens when light is available.",
  },
  {
    prompt: "The Calvin cycle mainly builds which product?",
    options: ["Glucose", "Nitrogen", "DNA", "Salt"],
    answer: "Glucose",
    feedback: "Exactly. It converts carbon dioxide into sugar using ATP and NADPH.",
  },
];

let currentCard = 0;
let currentQuestion = 0;
let score = 0;
let answered = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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

function runDemoGeneration() {
  const card = $("#processingCard");
  const text = $("#processingText");
  const steps = [
    "Extracting concepts, definitions, and likely exam questions...",
    "Building short notes and topic-wise summaries...",
    "Creating MCQs, flashcards, and simplified explanations...",
    "Study pack ready. Opening AI notes...",
  ];
  let step = 0;

  card.classList.remove("hidden");
  text.textContent = steps[step];

  const timer = setInterval(() => {
    step += 1;
    text.textContent = steps[step] || steps.at(-1);
    if (step === steps.length - 1) {
      clearInterval(timer);
      setTimeout(() => setPanel("notesPanel"), 650);
    }
  }, 800);
}

function updateFlashcard() {
  const card = flashcards[currentCard];
  $("#studyCard").classList.remove("flipped");
  $("#flashQuestion").textContent = card.question;
  $("#flashAnswer").textContent = card.answer;
}

function renderQuestion() {
  const question = questions[currentQuestion];
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

function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;

  appendMessage(value, "user");
  input.value = "";

  setTimeout(() => {
    const answer =
      "Based on the uploaded chapter, the key idea is energy conversion: light energy becomes ATP and NADPH, then those power glucose production in the Calvin cycle.";
    appendMessage(answer, "ai");
  }, 420);
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
  const values = [38, 54, 42, 68, 76, 88, 94];
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

  $("#watchDemo").addEventListener("click", () => {
    document.querySelector("#demo").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => runDemoGeneration(), 500);
  });

  $("#generateDemo").addEventListener("click", runDemoGeneration);
  $("#pdfInput").addEventListener("change", runDemoGeneration);

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
      const copy = {
        simple: "Plants use sunlight to make their own food. Leaves catch light, mix water and air, and create sugar.",
        detail:
          "Photosynthesis has two major stages: light reactions create ATP and NADPH, then the Calvin cycle uses that stored energy to turn carbon dioxide into glucose.",
        example:
          "Imagine a phone charging from sunlight. The plant charges energy batteries first, then spends that energy to cook sugar for later.",
      };
      $("#explainText").textContent = copy[button.dataset.explain];
    });
  });

  $("#nextQuestion").addEventListener("click", nextQuestion);
  $("#chatForm").addEventListener("submit", sendChat);
  window.addEventListener("resize", drawAnalytics);
}

document.addEventListener("DOMContentLoaded", () => {
  revealOnScroll();
  countUp();
  fillHeatmap();
  updateFlashcard();
  renderQuestion();
  drawAnalytics();
  wireEvents();
});
