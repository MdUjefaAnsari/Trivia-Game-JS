// Global state variables
let currentScreen = "home"; // Tracks the current screen the user is on (home, player input, etc.)
const app = document.getElementById("app"); // Reference to the main app container in the HTML
let selectedCategory = null; // Tracks the selected trivia category
let player1 = ""; // Player 1's name
let player2 = ""; // Player 2's name
let score = { player1: 0, player2: 0 }; // Tracks scores for both players
let usedCategories = new Set(); // Tracks categories that have been used to avoid repetition
let count = 1; // Keeps track of question count


// Utility function to render the selected template into the app container
const renderTemplate = (templateId) => {
  const template = document.getElementById(templateId); // Find the template by its ID
  if (template) {
    const clone = template.content.cloneNode(true); // Clone the template content
    app.innerHTML = ""; // Clear the app container
    app.appendChild(clone); // Append the cloned template to the app container
  }
};

// Fetch trivia categories from the API
const fetchCategories = async () => {
  try {
    const response = await fetch("https://the-trivia-api.com/v2/questions"); // Fetching questions to extract unique categories
    const data = await response.json(); // Parse the response as JSON
    const categories = [...new Set(data.map((q) => q.category))]; // Extract unique categories
    return categories; // Return the list of categories
  } catch (error) {
    console.error("Error fetching categories:", error); // Handle any errors during the fetch
    return [];
  }
};

// Fetch questions based on the selected category
const fetchQuestions = async (category) => {
  try {
    // Fetching questions with different difficulty levels (easy, medium, hard)
    const easyQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=easy&limit=2`
    );
    const mediumQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=medium&limit=2`
    );
    const hardQuestions = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&difficulty=hard&limit=2`
    );

    const easy = await easyQuestions.json(); // Parse easy questions
    const medium = await mediumQuestions.json(); // Parse medium questions
    const hard = await hardQuestions.json(); // Parse hard questions

    return [...easy, ...medium, ...hard]; // Combine all the questions and return them
  } catch (error) {
    console.error("Error fetching questions:", error); // Handle any errors during the fetch
    return [];
  }
};

// Home screen rendering
const renderHome = () => {
  currentScreen = "home"; // Set current screen to "home"
  renderTemplate("home-template"); // Render the home template

  // Start the game when the start button is clicked
  const startGameBtn = document.getElementById("startGameBtn");
  startGameBtn.addEventListener("click", renderPlayerInput); // Call renderPlayerInput when clicked
};

// Player input screen rendering
const renderPlayerInput = () => {
  currentScreen = "playerInput"; // Set the screen to "playerInput"
  renderTemplate("player-input-template"); // Render the player input template

  const startCategorySelectionBtn = document.getElementById("startCategorySelectionBtn");
  const cancelGameBtn = document.getElementById("cancelGameBtn");

  // Handle form submission for player names
  startCategorySelectionBtn.addEventListener("click", handlePlayerInput);
  cancelGameBtn.addEventListener("click", renderHome); // Cancel game and go back to the home screen
};

// Handle player input validation and transition to category selection
const handlePlayerInput = () => {
  player1 = document.getElementById("player1Name").value.trim(); // Get player 1 name
  player2 = document.getElementById("player2Name").value.trim(); // Get player 2 name
  const player1Error = document.getElementById("player1Error");
  const player2Error = document.getElementById("player2Error");

  let isValid = true;
  player1Error.textContent = "";
  player2Error.textContent = "";

  // Basic validation for player names
  if (!player1) {
    player1Error.textContent = "Player 1 name is required.";
    isValid = false;
  }
  if (!player2) {
    player2Error.textContent = "Player 2 name is required.";
    isValid = false;
  }

  if (isValid) {
    renderCategorySelection(); // Proceed to category selection if input is valid
  }
};

// Category selection screen rendering
const renderCategorySelection = async () => {
  currentScreen = "categorySelection"; // Set the screen to "categorySelection"
  renderTemplate("category-selection-template"); // Render the category selection template

  const categoryList = document.getElementById("categoryList");
  const categories = (await fetchCategories()).filter((category) => !usedCategories.has(category)); // Get categories that haven’t been used yet

  if (categories.length === 0) {
    alert("All categories are exhausted!"); // Alert if all categories are used
    renderWinner(score); // Display winner screen
    return;
  }

  // Create buttons for each category and set up their click handlers
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategory = category; // Set the selected category
      usedCategories.add(category); // Mark the category as used
      renderGamePlay(); // Start the game with the selected category
    });
    categoryList.appendChild(button); // Add button to the category list
  });
};

// Gameplay screen rendering
const renderGamePlay = async () => {
  const questions = await fetchQuestions(selectedCategory); // Fetch questions for the selected category
  let currentQuestionIndex = 0; // Initialize the question index

  const points = { easy: 10, medium: 15, hard: 20 }; // Points for each difficulty level

  const renderQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      renderPostQuestionOptions(); // If all questions are answered, move to the post-question options
      return;
    }

    const question = questions[currentQuestionIndex]; // Get the current question
    const options = [...question.incorrectAnswers, question.correctAnswer].sort(() => Math.random() - 0.5); // Shuffle answer options
    const currentPlayer = currentQuestionIndex % 2 === 0 ? player1 : player2; // Alternate turns between players

    renderTemplate("gameplay-template"); // Render the gameplay template

    document.getElementById("players").textContent = `${player1} ⚔️ ${player2}`;
    document.getElementById("scorePlayer1").textContent = `${player1}: ${score.player1} points`;
    document.getElementById("scorePlayer2").textContent = `${player2}: ${score.player2} points`;
    document.getElementById("turn").textContent = `Turn: ${currentPlayer}`;
    document.getElementById("category").textContent = `Category: ${selectedCategory}`;
    document.getElementById("difficulty").textContent = `Difficulty: ${question.difficulty}`;
    document.getElementById("question").textContent = `Question No. ${count++} : ${question.question}`;

    const answerOptions = document.getElementById("answerOptions");
    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => handleAnswer(option, question.difficulty));
      answerOptions.appendChild(button);
    });
  };

  // Handle answer selection
  const handleAnswer = (selectedAnswer, difficulty) => {
    const question = questions[currentQuestionIndex];
    const currentPlayerKey = currentQuestionIndex % 2 === 0 ? "player1" : "player2"; // Determine whose turn it is
    const isCorrect = selectedAnswer === question.correctAnswer; // Check if the selected answer is correct

    if (isCorrect) {
      score[currentPlayerKey] += points[difficulty]; // Update score if answer is correct
      alert(`${currentPlayerKey === "player1" ? player1 : player2} answered correct! ✅`);
    } else {
      alert(`Wrong answer! ❌`);
    }

    currentQuestionIndex++; // Move to the next question
    renderQuestion(); // Render the next question
  };

  renderQuestion(); // Start the first question
};

// Post-question options (show category buttons or end the game)
const renderPostQuestionOptions = async () => {
  renderTemplate("category-selection-template");

  const categoryList = document.getElementById("categoryList");
  const categories = (await fetchCategories()).filter((category) => !usedCategories.has(category));

  if (categories.length === 0) {
    alert("All categories are completed!");
    renderWinner(score); // Display winner screen if all categories are used
    return;
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategory = category;
      usedCategories.add(category);
      renderGamePlay(); // Start a new round with a different category
    });
    categoryList.appendChild(button);
  });

  // Add an "End Game" button
  const endGameButton = document.createElement("button");
  endGameButton.textContent = "End Game";
  endGameButton.style.backgroundColor = "red"; // Style the button
  endGameButton.style.color = "white";
  endGameButton.style.outline = "none";
  endGameButton.style.boxShadow = "2px 2px 13px 2px red";
  endGameButton.addEventListener("click", () => renderWinner(score)); // End the game and show the winner screen
  categoryList.appendChild(endGameButton);
};

// Winner screen rendering
const renderWinner = (score) => {
  renderTemplate("winner-template"); // Render the winner template

  // Determine the winner or if it's a tie
  const winner =
    score.player1 > score.player2
      ? player1
      : score.player2 > score.player1
      ? player2
      : "It's a Tie!";

  document.getElementById("winnerText").textContent =
    winner === "It's a Tie!" ? "It's a Tie! 🤝" : `🎉 Congratulations, ${winner}! 🏆`;
  document.getElementById("scoreSummaryPlayer1").textContent = `${player1}: ${score.player1} points`;
  document.getElementById("scoreSummaryPlayer2").textContent = `${player2}: ${score.player2} points`;

  // Add event listener for "Play Again" button to restart the game
  document.getElementById("playAgainBtn").addEventListener("click", () => {
    resetGameState(); // Reset game state
    renderHome(); // Return to home screen
  });
};

// Reset the game state to its initial values
const resetGameState = () => {
  currentScreen = "home"; // Reset to home screen
  selectedCategory = null;
  player1 = "";
  player2 = "";
  score = { player1: 0, player2: 0 }; // Reset scores
  usedCategories = new Set(); // Clear used categories
  currentQuestionIndex = 0; // Reset question index
  count = 1; // Reset question count
};

// Initialize the game by rendering the home screen
renderHome();
