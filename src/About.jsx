export default function About() {
  return (
    <div className="about">
      <h1>Om Wordle-spelet</h1>
      <p>Spelet är byggt med React på klienten och Express på servern.</p>
      <p>Du väljer ordlängd och om ordet ska innehålla upprepade bokstäver.</p>
      <p>Gissningar analyseras på servern och återkopplar korrekt, fel plats eller inkorrekt bokstav.</p>
      <p>Efter vinst kan du spara ditt resultat i en persistent highscore-lista.</p>
    </div>
  )
}
