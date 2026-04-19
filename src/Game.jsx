import { useState } from "react"
const initialSettings = { length: 5, unique: false }
export default function Game() {
  const [gameId, setGameId] = useState(null)
  const [settings, setSettings] = useState(initialSettings)
  const [guesses, setGuesses] = useState([])
  const [feedback, setFeedback] = useState([])
  const [message, setMessage] = useState("Välj inställningar och starta spelet.")
  const [guess, setGuess] = useState("")
  const [finished, setFinished] = useState(false)
  const [won, setWon] = useState(false)
  const [name, setName] = useState("")
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function startGame() {
    setError("")
    const response = await fetch(`/api/start?length=${settings.length}&unique=${settings.unique}`)
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Starta spelet misslyckades")
      return
    }
    setGameId(data.gameId)
    setGuesses([])
    setFeedback([])
    setMessage("Spelet har startat. Gissa ordet.")
    setGuess("")
    setFinished(false)
    setWon(false)
    setSaved(false)
    setName("")
    setDuration(0)
    setStartTime(Date.now())
  }

  async function submitGuess(event) {
    event.preventDefault()
    if (!gameId) {
      setError("Starta spelet först")
      return
    }
    const normalized = guess.trim().toLowerCase()
    if (normalized.length !== settings.length) {
      setError(`Skriv exakt ${settings.length} bokstäver`)
      return
    }
    setError("")
    const response = await fetch("/api/guess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gameId, guess: normalized }),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Gissning misslyckades")
      return
    }
    setGuesses((current) => [...current, normalized])
    setFeedback((current) => [...current, data.feedback])
    setMessage(data.message)
    setGuess("")
    if (data.finished) {
      setFinished(true)
      setWon(data.won)
      setDuration(Date.now() - startTime)
    }
  }

  async function submitScore(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Ange ett namn")
      return
    }
    const payload = {
      name: name.trim(),
      durationMs: duration,
      guesses,
      length: settings.length,
      unique: settings.unique,
    }
    const response = await fetch("/api/highscores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Kunde inte spara resultat")
      return
    }
    setSaved(true)
    setMessage("Resultat sparat")
  }

  return (
    <div className="game">
      <section className="panel">
        <h1>Wordle-spel</h1>
        <div className="options">
          <label>
            Ordets längd
            <select value={settings.length} onChange={(event) => setSettings({ ...settings, length: Number(event.target.value) })}>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
            </select>
          </label>
          <label>
            Unika bokstäver
            <input type="checkbox" checked={settings.unique} onChange={(event) => setSettings({ ...settings, unique: event.target.checked })} />
          </label>
          <button type="button" onClick={startGame}>Starta nytt spel</button>
        </div>
        <p className="status">{message}</p>
        <form className="guess-form" onSubmit={submitGuess}>
          <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder={`Gissa ${settings.length} bokstäver`} disabled={finished || !gameId} maxLength={settings.length} />
          <button type="submit" disabled={finished || !gameId}>Gissa</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
      <section className="panel">
        <h2>Gissningar</h2>
        <div className="history">
          {guesses.length === 0 && <p>Inga gissningar ännu.</p>}
          {guesses.map((row, index) => (
            <div key={index} className="row">
              {row.split("").map((letter, letterIndex) => (
                <span key={letterIndex} className={`tile ${feedback[index][letterIndex]}`}>
                  {letter.toUpperCase()}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
      {finished && won && !saved && (
        <section className="panel">
          <h2>Spara highscore</h2>
          <form onSubmit={submitScore} className="score-form">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ditt namn" />
            <button type="submit">Spara resultat</button>
          </form>
        </section>
      )}
      {finished && won && saved && (
        <section className="panel"><p>Resultat sparat. Se listan på highscore-sidan.</p></section>
      )}
    </div>
  )
}
