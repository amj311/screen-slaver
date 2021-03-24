var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

var highscores = require("highscores.json") || [];


app.get('/scores', (req, res) => {
    let max = parseInt(req.query.max)
    res.send(highscores.slice(0, max))
})

app.get('/scores/:username', (req, res) => {
    let userScores = highscores.filter(score => { return score.username === req.params.username })
    console.log(req.params.username, userScores)
    res.send(userScores)
})


app.post('/scores', (req, res) => {

    let newScore = parseInt(req.body.score);
    let foundSpot = false;

    let idx = 0;

    for (; idx < highscores.length; idx++) {

        if (!foundSpot && highscores[idx].score < newScore) {
            req.body.rank = parseInt(idx) + 1;
            highscores.splice(idx, 0, req.body)
            foundSpot = true;
            break;
        }

    }

    if (foundSpot) {
        console.log(idx)

        for (; idx < highscores.length; idx++) {
            highscores[idx].rank = idx + 1;
        }
    }

    if (!foundSpot) {
        let score = req.body;
        score.rank = highscores.length + 1;
        highscores.push(req.body)
    }

    fs.writeFile("highscores.json", JSON.stringify(highscores), (err) => {
        if (err)
            console.log(err);
        else {
            console.log("File written successfully\n");
            console.log("The written has the following contents:");
            console.log(fs.readFileSync("books.txt", "utf8"));
        }
    });

    res.send(highscores)
})

module.exports = app;
