const express = require('express');
const logger = require('morgan');
const Sentry = require("@sentry/node");
const config = require(__dirname + "/config/config.json")["sentry"];
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

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

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});


app.use('api/v1/', indexRouter);

module.exports = app;
