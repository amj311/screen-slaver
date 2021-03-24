var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())



const MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb').ObjectID;

let db;
let Scores;
// connect to the database
MongoClient.connect('mongodb+srv://amj311:be13strong51@cluster0-u6luc.mongodb.net/screenslaver', { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected to Database')
    db = client.db("screenslaver");
    Scores = db.collection("scores");
});




app.get('/scores', (req, res) => {
    let max = parseInt(req.query.max)
    Scores.find({}).toArray(function (err, list) {
        if (!err) {
            res.status(200);
            list.sort( (a,b)=>a.rank-b.rank)
            res.send(list.slice(0, max))
        }
        else {
            console.log(err)
            res.status(500);
            res.json({ ok: false });
        }
    });
})

app.get('/scores/:username', (req, res) => {
    let username = req.params.username;
    Scores.find({username}).toArray(function (err, list) {
        if (!err) {
            res.status(200);
            list.sort( (a,b)=>a.rank-b.rank)
            res.send(list)
        }
        else {
            console.log(err)
            res.status(500);
            res.json({ ok: false });
        }
    });
})


app.post('/scores', async (req, res) => {
    Scores.find({}).toArray(async function (err, list) {
        if (!err) {
            let highscores = list;
            highscores.sort( (a,b)=>a.rank-b.rank)

            let newScore = req.body;
            let foundSpot = false;
        
            let idx = 0;
        
            for (; idx < highscores.length; idx++) {
                if (!foundSpot && highscores[idx].score < parseInt(newScore.score)) {
                    newScore.rank = parseInt(idx) + 1;
                    highscores.splice(idx, 0, newScore)
                    foundSpot = true;
                    break;
                }
            }
        
            if (foundSpot) {
                for (; idx < highscores.length; idx++) {
                    highscores[idx].rank = idx + 1;
                    await Scores.replaceOne(
                        { "_id": new ObjectID(highscores[idx]._id) },
                        highscores[idx]
                      ).then(result=>{
                        let success = result.modifiedCount >= 1;
                        if (success) {
                          console.log("Saved!")
                        }
                        else {
                          console.log("Not saved...")
                        }
                      })
                      .catch(err=>{
                        console.log("Error:")
                        console.log(err)
                      });
                }
            }
        
            // is lowest score, add to end
            if (!foundSpot) {
                newScore.rank = highscores.length + 1;
                highscores.push(newScore)
            }
        
            await Scores.insertOne(newScore).then(result=>{
                // console.log(result.result)
                let success = result.insertedCount >= 1;
                if (success) {
                  console.log("Saved!")
                }
                else {
                  console.log("Not saved...")
                }
              });
        
            Scores.aggregate(
                [
                  { $sort : { rank : 1 } }
                ]
             )
        
            res.send(highscores)
        }
        else {
            console.log(err)
            res.status(500);
            res.json({ ok: false });
        }
    });

})

module.exports = app;
