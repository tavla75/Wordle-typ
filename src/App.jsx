import Game from "./Game.jsx"
import About from "./About.jsx"
const path = window.location.pathname
export default function App() {
  return (
    <div className="page">
      <nav className="nav">
        <a href="/">Spela</a>
        <a href="/about">Om</a>
        <a href="/highscore">Highscore</a>
      </nav>
      <main className="content">
        {path === "/about" ? <About /> : <Game />}
      </main>
    </div>
  )
}
