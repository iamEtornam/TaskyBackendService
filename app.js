const express = require('express');
const logger = require('morgan');
const mailgun = require("mailgun-js");
const env = process.env.NODE_ENV || "mailserver";
const mailConfig = require(__dirname + "/config/config.json")[env];
const config = require(__dirname + "/config/config.json")["sentry"];
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

const indexRouter = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

Sentry.AWSLambda.init({
  dsn: config.apiKey,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const mg = mailgun({
  apiKey: mailConfig.apiKey,
  domain: mailConfig.domain,
});


app.use('api/v1/', indexRouter);

module.exports = app;
