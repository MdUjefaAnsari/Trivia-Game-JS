

// Global state variables
let currentScreen = "home";
const app = document.getElementById("app");
let selectedCategory = null;
let player1 = "";
let player2 = "";
let score = { player1: 0, player2: 0 };
let usedCategories = new Set();
let count=1;

// Utility to render templates
const renderTemplate = (templateId) => {
  const template = document.getElementById(templateId);
  if (template) {
    const clone = template.content.cloneNode(true);
    app.innerHTML = "";
    app.appendChild(clone);
  }
};

// Fetch categories from API
const fetchCategories = async () => {
  try {
    const response = await fetch("https://the-trivia-api.com/v2/questions");
    const data = await response.json();
    const categories = [...new Set(data.map((q) => q.category))];
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Fetch questions based on category
const fetchQuestions = async (category) => {
  try {
    const easyQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=easy&limit=2`
    );
    const mediumQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=medium&limit=2`
    );
    const hardQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=hard&limit=2`
    );

    const easy = await easyQuestions.json();
    const medium = await mediumQuestions.json();
    const hard = await hardQuestions.json();

    return [...easy, ...medium, ...hard];
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

// Home Screen
const renderHome = () => {
  currentScreen = "home";
  renderTemplate("home-template");

  const startGameBtn = document.getElementById("startGameBtn");
  startGameBtn.addEventListener("click", renderPlayerInput);
};

// Player Input Screen
const renderPlayerInput = () => {
  currentScreen = "playerInput";
  renderTemplate("player-input-template");

  const startCategorySelectionBtn = document.getElementById("startCategorySelectionBtn");
  const cancelGameBtn = document.getElementById("cancelGameBtn");

  startCategorySelectionBtn.addEventListener("click", handlePlayerInput);
  cancelGameBtn.addEventListener("click", renderHome);
};

const handlePlayerInput = () => {
  player1 = document.getElementById("player1Name").value.trim();
  player2 = document.getElementById("player2Name").value.trim();
  const player1Error = document.getElementById("player1Error");
  const player2Error = document.getElementById("player2Error");

  let isValid = true;
  player1Error.textContent = "";
  player2Error.textContent = "";

  if (!player1) {
    player1Error.textContent = "Player 1 name is required.";
    isValid = false;
  }
  if (!player2) {
    player2Error.textContent = "Player 2 name is required.";
    isValid = false;
  }

  if (isValid) {
    renderCategorySelection();
  }
};

// Category Selection Screen
const renderCategorySelection = async () => {
  currentScreen = "categorySelection";
  renderTemplate("category-selection-template");

  const categoryList = document.getElementById("categoryList");
  const categories = (await fetchCategories()).filter((category) => !usedCategories.has(category));

  if (categories.length === 0) {
    alert("All categories are exhausted!");
    renderWinner(score);
    return;
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategory = category;
      usedCategories.add(category);
      renderGamePlay();
    });
    categoryList.appendChild(button);
  });
};

// Gameplay Screen
const renderGamePlay = async () => {
  const questions = await fetchQuestions(selectedCategory);
  let currentQuestionIndex = 0;

  const points = { easy: 10, medium: 15, hard: 20 };

  const renderQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      renderPostQuestionOptions();
      return;
    }

    const question = questions[currentQuestionIndex];
    const options = [...question.incorrectAnswers, question.correctAnswer].sort(() => Math.random() - 0.5);
    const currentPlayer = currentQuestionIndex % 2 === 0 ? player1 : player2;

    renderTemplate("gameplay-template");

    document.getElementById("players").textContent = `${player1} VS ${player2}`;
    document.getElementById("scorePlayer1").textContent = `${player1}: ${score.player1} points`;
    document.getElementById("scorePlayer2").textContent = `${player2}: ${score.player2} points`;
    document.getElementById("turn").textContent = `Turn: ${currentPlayer}`;
    document.getElementById("category").textContent = `Category: ${selectedCategory}`;
    document.getElementById("difficulty").textContent = `Difficulty: ${question.difficulty}`;
    document.getElementById("question").textContent =`Question No. ${count++ } :  `+ question.question;

    const answerOptions = document.getElementById("answerOptions");
    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => handleAnswer(option, question.difficulty));
      answerOptions.appendChild(button);
    });
  };

  const handleAnswer = (selectedAnswer, difficulty) => {
    const question = questions[currentQuestionIndex];
    const currentPlayerKey = currentQuestionIndex % 2 === 0 ? "player1" : "player2";
    const isCorrect = selectedAnswer === question.correctAnswer;

    if (isCorrect) {
      score[currentPlayerKey] += points[difficulty];
      alert(`${currentPlayerKey === "player1" ? player1 : player2} answered correctly!`);
    } else {
      alert("Wrong answer!");
    }

    currentQuestionIndex++;
    renderQuestion();
  };

  renderQuestion();
};

// Post-Question Options
const renderPostQuestionOptions = async () => {
  renderTemplate("category-selection-template");

  const categoryList = document.getElementById("categoryList");
  const categories = (await fetchCategories()).filter((category) => !usedCategories.has(category));

  if (categories.length === 0) {
    alert("All categories are completed!");
    renderWinner(score);
    return;
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategory = category;
      usedCategories.add(category);
      renderGamePlay();
    });
    categoryList.appendChild(button);
  });

  const endGameButton = document.createElement("button");
  endGameButton.textContent = "End Game";
  endGameButton.style.backgroundColor = "red";
  endGameButton.style.color="white";
  endGameButton.style.outline="none";
  endGameButton.style.boxShadow="2px 2px 13px 2px red"
  endGameButton.addEventListener("click", () => renderWinner(score));
  categoryList.appendChild(endGameButton);
};


// Winner Screen
const renderWinner = (score) => {
  renderTemplate("winner-template");

  const winner =
    score.player1 > score.player2
      ? player1
      : score.player2 > score.player1
      ? player2
      : "It's a Tie!";

  document.getElementById("winnerText").textContent =
    winner === "It's a Tie!" ? "It's a Tie!" : `Congratulations, ${winner}!`;
  document.getElementById("scoreSummaryPlayer1").textContent = `${player1}: ${score.player1} points`;
  document.getElementById("scoreSummaryPlayer2").textContent = `${player2}: ${score.player2} points`;

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetGameState(); 
    renderHome();   
  });

};

const resetGameState = () => {
  currentScreen = "home";
  selectedCategory = null;
  player1 = "";
  player2 = "";
  score = { player1: 0, player2: 0 };
  usedCategories = new Set();
  currentQuestionIndex = 0;
  count=1
};



// Initialize game
renderHome();
