const express = require('express');
const logger = require('morgan');
const Sentry = require("@sentry/node");
const config = require(__dirname + "/config/config.json")["sentry"];
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const indexRouter = require('./routes/index');

Sentry.init({ dsn: config.apiKey });

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use('api/v1/', indexRouter);

app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // show only report errors with these status code
        if (
            error.status === 401 ||
            error.status === 500 ||
            error.status === 400
        ) {
          return true;
        }
        return false;
      },
    })
);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end(res.sentry + "\n");
});

module.exports = app;
