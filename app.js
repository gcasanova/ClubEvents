var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var aws = require('aws-sdk');

var routes = require('./routes/index');
var facebook = require('./routes/facebook');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/facebook', facebook);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// common functions
// functions
function logDebug(message) {
  fs.appendFile('./logs/debug.txt', new Date().getTime() + ": " + message + "\n", function (err) {
    if (err) {
      throw err;
    }
  });
}

function logError(message) {
  fs.appendFile('./logs/errors.txt', new Date().getTime() + ": " + message + "\n", function (err) {
    if (err) {
      throw err;
    }
  });
}

function uploadLogs() {
  fs.exists('./logs/debug.txt', function (exists) {
    if (exists) {
      var today = new Date();
      var body = fs.readFileSync('./logs/debug.txt');
      var key = today.getUTCDate() + "-" + (today.getUTCMonth() + 1) + "-" + today.getUTCFullYear() + "_" + (("0" + today.getUTCHours()).slice(-2)) + ":" + (("0" + today.getUTCMinutes()).slice(-2)) + "_debug.txt";
      var s3 = new aws.S3({
        params : {
          Bucket : AWS_BUCKET_NAME_LOGS,
          Key : key
        }
      });
      
      s3.upload({Body : body}, function(err, data) {
        if (!err) {
          fs.unlinkSync('./logs/debug.txt');
        } else {
          logError("UPLOAD DEBUG LOGS TO S3 ERROR: " + err);
        }
      });
    }
  });
  
  
  fs.exists('./logs/errors.txt', function (exists) {
    if (exists) {
      var today = new Date();
      var body = fs.readFileSync('./logs/errors.txt');
      var key = today.getUTCDate() + "-" + (today.getUTCMonth() + 1) + "-" + today.getUTCFullYear() + "_" + (("0" + today.getUTCHours()).slice(-2)) + ":" + (("0" + today.getUTCMinutes()).slice(-2)) + "_errors.txt";
      var s3 = new aws.S3({
        params : {
          Bucket : AWS_BUCKET_NAME_LOGS,
          Key : key
        }
      });
      
      s3.upload({Body : body}, function(err, data) {
        if (!err) {
          fs.unlinkSync('./logs/errors.txt');
        } else {
          logError("UPLOAD ERRORS LOGS TO S3 ERROR: " + err);
        }
      });
    }
  });
}

var interval = setInterval(function() {
  uploadLogs();
}, 3600000);

module.exports = app;
