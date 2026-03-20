const words = ["apple","grape","brick","charm","flute","house","plant","train","light","sound"];

function randomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function evaluateGuess(secret, guess) {
  const result = ["", "", "", "", ""];
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === secret[i]) {
      result[i] = "G";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === secret[j]) {
        result[i] = "Y";
        used[j] = true;
        break;
      }
    }
    if (!result[i]) result[i] = "X";
  }

  return result;
}

function playWordleDOM() {
  const status = document.getElementById("status");
  const history = document.getElementById("history");
  const guessInput = document.getElementById("guessInput");
  const guessButton = document.getElementById("guessButton");
  const newGame = document.getElementById("newGame");

  let secret = "";
  let round = 0;
  const maxGuesses = 6;

  function setStatus(text) {
    status.textContent = text;
  }

  function addHistory(guess, evalResult) {
    const row = document.createElement("div");
    row.textContent = `${guess} -> ${evalResult.join("")}`;
    history.appendChild(row);
  }

  function startGame() {
    secret = randomWord();
    round = 0;
    history.textContent = "";
    setStatus("Guess a 5-letter word.");
    guessInput.value = "";
    guessInput.disabled = false;
    guessButton.disabled = false;
    guessInput.focus();
  }

  guessButton.addEventListener("click", () => {
    const guessRaw = guessInput.value.trim().toLowerCase();
    if (guessRaw.length !== 5) {
      setStatus("Enter exactly 5 letters.");
      return;
    }

    round++;
    const evalResult = evaluateGuess(secret, guessRaw);
    addHistory(guessRaw, evalResult);

    if (guessRaw === secret) {
      setStatus(`You win in ${round}/${maxGuesses}! Word was ${secret}.`);
      guessInput.disabled = true;
      guessButton.disabled = true;
      return;
    }

    if (round >= maxGuesses) {
      setStatus(`You lose. Word was ${secret}.`);
      guessInput.disabled = true;
      guessButton.disabled = true;
      return;
    }

    setStatus(`Round ${round}/${maxGuesses}. Keep going.`);
    guessInput.value = "";
    guessInput.focus();
  });

  newGame.addEventListener("click", startGame);
  startGame();
}

if (typeof window !== "undefined" && document) {
  playWordleDOM();
}

module.exports = { evaluateGuess, randomWord, words };
