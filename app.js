require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const Sentry = require("@sentry/node");
const admin = require("firebase-admin");
const utils = require("./utils/utils");
const indexRouter = require("./routes/index");
// Importing @sentry/tracing patches the global hub for tracing to work.
const Tracing = require("@sentry/tracing");

const app = express();

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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

utils
  .generateTempFile("service.json", process.env.GOOGLE_SERVICE_KEY)
  .then((serviceAccount) => {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  });

app.use("api/v1/", indexRouter);

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
