var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const cmd = require("node-cmd");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(cors({
  'allowedHeaders': ['Content-Type', 'API-Key', 'API-Secret', 'Access-Control-Allow-Headers', 'accept', 'client-security-token', 'x-github-event'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  'preflightContinue': false,
  'credentials': true
}));
app.options('*', function (req,res) { res.sendStatus(200); });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;