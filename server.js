import express from "express"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { createServer as createViteServer } from "vite"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const dataDir = path.join(__dirname, "data")
const wordsPath = path.join(dataDir, "words.json")
const scoresPath = path.join(dataDir, "highscores.json")
const wordsByLength = JSON.parse(fs.readFileSync(wordsPath, "utf8"))
const maxGuesses = 6
const games = new Map()
function randomWord(length, unique) {
  const list = wordsByLength[length] || []
  const candidates = unique ? list.filter((word) => new Set(word).size === length) : list
  if (!candidates.length) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}
function evaluateGuess(secret, guess) {
  const result = Array(secret.length).fill("incorrect")
  const used = Array(secret.length).fill(false)
  for (let i = 0; i < secret.length; i += 1) {
    if (guess[i] === secret[i]) {
      result[i] = "correct"
      used[i] = true
    }
  }
  for (let i = 0; i < secret.length; i += 1) {
    if (result[i] === "correct") continue
    for (let j = 0; j < secret.length; j += 1) {
      if (!used[j] && guess[i] === secret[j]) {
        result[i] = "misplaced"
        used[j] = true
        break
      }
    }
  }
  return result
}
function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(scoresPath, "utf8"))
  } catch {
    return []
  }
}
function saveScores(scores) {
  fs.writeFileSync(scoresPath, JSON.stringify(scores, null, 2))
}
const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(__dirname, "dist"))
async function startServer() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  app.use(express.json())
  let vite
  if (!isProduction) {
    vite = await createViteServer({ server: { middlewareMode: "ssr" } })
    app.use(vite.middlewares)
  } else {
    app.use(express.static(path.join(__dirname, "dist")))
  }
  app.get("/api/start", (req, res) => {
    const length = Number(req.query.length) || 5
    const unique = req.query.unique === "true"
    const secret = randomWord(length, unique)
    if (!secret) {
      res.status(400).json({ error: "Inga ord kunde väljas" })
      return
    }
    const gameId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    games.set(gameId, { secret, attempts: 0 })
    res.json({ gameId, maxGuesses })
  })
  app.post("/api/guess", (req, res) => {
    const { gameId, guess } = req.body
    if (!gameId || !guess) {
      res.status(400).json({ error: "gameId eller gissning saknas" })
      return
    }
    const game = games.get(gameId)
    if (!game) {
      res.status(404).json({ error: "Spelet hittades inte" })
      return
    }
    if (guess.length !== game.secret.length) {
      res.status(400).json({ error: `Skriv exakt ${game.secret.length} bokstäver` })
      return
    }
    game.attempts += 1
    const feedback = evaluateGuess(game.secret, guess)
    const won = guess === game.secret
    const finished = won || game.attempts >= maxGuesses
    if (finished) games.delete(gameId)
    const message = won
      ? `Rätt! Du vann på ${game.attempts} försök.`
      : finished
      ? `Spelet är slut. Ordet var ${game.secret}.`
      : `Fel. Försök igen (${game.attempts}/${maxGuesses}).`
    res.json({ feedback, won, finished, attempts: game.attempts, message })
  })
  app.post("/api/highscores", (req, res) => {
    const { name, durationMs, guesses, length, unique } = req.body
    if (!name || typeof durationMs !== "number" || !Array.isArray(guesses)) {
      res.status(400).json({ error: "Ogiltigt resultat" })
      return
    }
    const scores = loadScores()
    const entry = {
      name,
      durationMs,
      guesses,
      length,
      unique,
      createdAt: new Date().toISOString(),
    }
    scores.push(entry)
    saveScores(scores)
    res.json({ success: true })
  })
  app.get("/api/highscores", (req, res) => {
    const scores = loadScores().sort((a, b) => a.durationMs - b.durationMs).slice(0, 20)
    res.json(scores)
  })
  app.get("/highscore", (req, res) => {
    const scores = loadScores().sort((a, b) => a.durationMs - b.durationMs).slice(0, 20)
    const rows = scores
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${(item.durationMs / 1000).toFixed(2)}s</td><td>${item.guesses.length}</td><td>${item.length}</td><td>${item.unique ? "Ja" : "Nej"}</td></tr>`
      )
      .join("")
    res.send(`<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Highscore</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#eef2ff;color:#111;padding:24px}main{max-width:900px;margin:0 auto;background:#fff;padding:24px;border-radius:18px;box-shadow:0 1px 8px rgba(15,23,42,.08)}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:12px 10px;text-align:left;border-bottom:1px solid #e2e8f0}th{background:#f8fafc}a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><main><h1>Highscore</h1><p><a href="/">Tillbaka till spelet</a></p><table><thead><tr><th>Namn</th><th>Tid</th><th>Gissningar</th><th>Längd</th><th>Unika</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Ingen highscore sparad ännu.</td></tr>'}</tbody></table></main></body></html>`)
  })
  app.get("/*", async (req, res) => {
    const indexPath = path.resolve(__dirname, "index.html")
    let html = fs.readFileSync(indexPath, "utf8")
    if (!isProduction) {
      html = await vite.transformIndexHtml(req.originalUrl, html)
    }
    res.status(200).set({ "Content-Type": "text/html" }).send(html)
  })
  app.listen(5080)
}
startServer()
