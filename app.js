require("dotenv").config();
const createError = require('http-errors');
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const Sentry = require("@sentry/node");
const admin = require("firebase-admin");
const utils = require("./utils/utils");
const allRouters = require("./routes/all_routes");
// Importing @sentry/tracing patches the global hub for tracing to work.
const Tracing = require("@sentry/tracing");

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

Sentry.init({
  dsn: process.env.SENTRY_API_KEY,
  environment: process.env.NODE_ENV,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});


app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

utils
  .generateTempFile("service.json", process.env.GOOGLE_SERVICE_KEY)
  .then((serviceAccount) => {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  });


app.use("/api/v1", allRouters);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = err;

  // render the error page
  res.status(err.status || 500);
  res.end(res.sentry + "\n");
});

module.exports = app;
