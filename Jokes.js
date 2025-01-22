const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const http = require("http");
const app = express();

app.use(bodyParser.json());

const jokesFile = "jokes.json"; // File to store the jokes persistently
let jokes = []; // Array to store jokes as objects { user, joke }
let jokesOpen = true; // Flag to track whether adding jokes is allowed

// Load the jokes from the file on server startup
if (fs.existsSync(jokesFile)) {
    try {
        jokes = JSON.parse(fs.readFileSync(jokesFile, "utf-8"));
    } catch (err) {
        console.error("Error loading jokes from file:", err);
        jokes = [];
    }
}

// Function to save the jokes to the file
function saveJokes() {
    try {
        fs.writeFileSync(jokesFile, JSON.stringify(jokes, null, 2), "utf-8");
    } catch (err) {
        console.error("Error saving jokes to file:", err);
    }
}

// Default route
app.get("/", (req, res) => {
    res.send("Welcome to the Nightbot Jokes Manager! Use /jokes, /add-to-jokes, /clear-jokes, /open-jokes, /close-jokes, or /next.");
});

// Endpoint to show a random joke from the list
app.get("/next", (req, res) => {
    if (jokes.length > 0) {
        const randomIndex = Math.floor(Math.random() * jokes.length);
        const randomJoke = jokes[randomIndex];
        return res.send(`Random joke: ${randomJoke.joke} (Submitted by: ${randomJoke.user})`);
    } else {
        return res.send("The jokes list is currently empty.");
    }
});

// POST endpoint to handle the "!jokes" command
app.post("/add-to-jokes", (req, res) => {
    const { user, message } = req.body;

    if (!jokesOpen) {
        return res.send(`@${user}, jokes submissions are currently closed. You cannot add jokes right now.`);
    }

    const jokeText = message.replace("!jokes ", "").trim();
    if (jokeText) {
        jokes.push({ user, joke: jokeText });
        saveJokes(); // Save the jokes to the file
        return res.send(`@${user}, your joke has been added! Current jokes count: ${jokes.length} jokes.`);
    } else {
        return res.send(`@${user}, please provide a joke to add. Usage: !jokes <your joke>`);
    }
});

// GET endpoint for /add-to-jokes (Nightbot-compatible)
app.get("/add-to-jokes", (req, res) => {
    const user = req.query.user || "anonymous";
    const message = req.query.message || "";

    if (!jokesOpen) {
        return res.send(`@${user}, jokes submissions are currently closed. You cannot add jokes right now.`);
    }

    const jokeText = message.replace("!jokes ", "").trim();
    if (jokeText) {
        jokes.push({ user, joke: jokeText });
        saveJokes(); // Save the jokes to the file
        return res.send(`@${user}, your joke has been added! Current jokes count: ${jokes.length} jokes.`);
    } else {
        return res.send(`@${user}, please provide a joke to add. Usage: !jokes <your joke>`);
    }
});

// POST endpoint to remove a specific joke from the list
app.post("/remove-from-jokes", (req, res) => {
    const { user, message } = req.body;

    const position = parseInt(message.replace("!removejokes ", "").trim(), 10);

    if (!isNaN(position) && position > 0 && position <= jokes.length) {
        const removedJoke = jokes.splice(position - 1, 1); // Remove the joke at the given position
        saveJokes(); // Save the updated jokes list to the file
        return res.send(`@${user}, joke #${position} has been removed!`);
    } else {
        return res.send(`@${user}, invalid position. Please provide a valid joke number to remove.`);
    }
});

// GET endpoint for /remove-from-jokes (Nightbot-compatible)
app.get("/remove-from-jokes", (req, res) => {
    const position = parseInt(req.query.position, 10);

    if (!isNaN(position) && position > 0 && position <= jokes.length) {
        const removedJoke = jokes.splice(position - 1, 1); // Remove the joke at the given position
        saveJokes(); // Save the updated jokes list to the file
        return res.send(`Joke #${position} has been removed!`);
    } else {
        return res.send("Invalid position. Please provide a valid joke number to remove.");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});