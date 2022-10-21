"use strict";
const db = require("./models");
const Sentry = require("@sentry/node");
const Inbox = db.inbox;
const Comment = db.comment;
const utils = require("./utils");

//*************** INBOX */
module.exports.getUserInbox = async function rootHandler(req, res) {
  try {
    const token = await utils.verifyToken(
      req.headers.Authorization === undefined
        ? req.headers.authorization
        : req.headers.Authorization
    );
    if (token == null) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    const inbox = await Inbox.findAll({
      where: {
        userId: req.pathParameters.userId,
      },
      include: ["comments", "user"],
      attributes: {
        exclude: ["inboxId", "auth_token"], ///remove auth_token from the results
      },
    });

    if (inbox) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "List of messages",
          data: inbox,
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "No Messages found",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify({
        status: false,
        message: error.message,
      }),
    };
  }
};

module.exports.getUserInboxComment = async function rootHandler(req, res) {
  try {
    const token = await utils.verifyToken(
      req.headers.Authorization === undefined
        ? req.headers.authorization
        : req.headers.Authorization
    );
    if (token == null) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    const coments = await Comment.findAll({
      where: {
        inboxId: req.pathParameters.inboxId,
      },
      include: ["user"],
    });

    if (coments) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "List of comment of an inbox",
          data: coments,
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "No comment found",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify({
        status: false,
        message: error.message,
      }),
    };
  }
};
