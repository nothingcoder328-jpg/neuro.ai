# NeuroNote AI

Premium AI-style student study platform for PDFs, notes, quizzes, flashcards, and analytics.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

You can also open `index.html` directly, but `npm start` is better because it enables the `/api/analyze` backend route.

## Use The App

1. Open the app.
2. Click `Open App`.
3. Go to `Upload PDF`.
4. Choose a PDF/text file or paste study material.
5. Click `Generate Study Pack`.
6. Review generated notes, explanations, flashcards, quiz questions, chat answers, and analytics.

## Deploy On Railway

Railway should detect Node automatically.

Start command:

```bash
npm start
```

The server uses Railway's `PORT` environment variable automatically.

## Real AI Generation

The app works without an API key using the built-in local generator. For real AI notes, flashcards, explanations, and quizzes, add this Railway variable:

```text
OPENAI_API_KEY=your_openai_key_here
```

Optional:

```text
OPENAI_MODEL=gpt-4o-mini
```

After adding the variable, redeploy the Railway project.

## Ranking

XP, streaks, quiz accuracy, rank, reviewed flashcards, and leaderboard position are saved in the browser with `localStorage`. For a real global class leaderboard across many users, connect authentication and a database such as Supabase or Firebase.

## Files

- `index.html` - landing page and full student workspace
- `styles.css` - premium dark glass UI and responsive layout
- `app.js` - upload flow, PDF text extraction, study pack generation, storage, quiz, flashcards, chat, and charts
- `server.js` - Node static server plus `/api/analyze`
- `package.json` - Railway start script
