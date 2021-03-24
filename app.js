var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const cmd = require("node-cmd");

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use('/', indexRouter);
app.post('/git', (req, res) => {
  // If event is "push"
  if (req.headers['x-github-event'] == "push") {
    cmd.run('chmod 777 git.sh'); /* :/ Fix no perms after updating */
    cmd.get('./git.sh', (err, data) => {  // Run our script
      if (data) console.log(data);
      if (err) console.log(err);
    });
    cmd.run('refresh');  // Refresh project
  
    console.log("> [GIT] Updated with origin/master");
    if (req.body.head_commit) {
      let commits = req.body.head_commit.message.split("\n").length == 1 ?
              req.body.head_commit.message :
              req.body.head_commit.message.split("\n").map((el, i) => i !== 0 ? "                       " + el : el).join("\n");
      console.log(`        Latest commit: ${commits}`);
    }
  }

  return res.sendStatus(200); // Send back OK status
});


module.exports = app;