"use strict";
const db = require("../models");
const Sentry = require("@sentry/node");
const Inbox = db.inbox;
const Comment = db.comment;
const utils = require("../utils/utils");

//*************** INBOX */
const getUserInbox = async function rootHandler(req, res) {
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
        userId: req.params.userId,
      },
      include: ["comments", "user"],
      attributes: {
        exclude: ["inboxId", "auth_token"], ///remove auth_token from the results
      },
    });

    if (inbox) {
      return res.status(200).send({
        status: true,
        message: "List of messages",
        data: inbox,
      });
    } else {
      return res.status(404).send({
        status: true,
        message: "List of messages",
        data: inbox,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(400).send({
      status: false,
      message: error.message,
    });
  }
};

const getUserInboxComment = async function rootHandler(req, res) {
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

    const comments = await Comment.findAll({
      where: {
        inboxId: req.params.inboxId,
      },
      include: ["user"],
    });

    if (comments) {
      return res.status(200).send({
        status: true,
        message: "List of comment of an inbox",
        data: comments,
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "No comment found",
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(400).send({
      status: false,
      message: error.message,
    });
  }
};


const createInbox = async function rootHandler(req, res) { 
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
    const requestBody = req.body;
    const inbox = await Inbox.create(requestBody);

      if (inbox) {
        return res.status(201).send({
          status: true,
          message: "Message created successfully!",
          data: inbox,
        });
      } else {
        return res.status(404).send({
          status: false,
          message: "Could not create message",
        });
      }
    
  } catch (error) {
        Sentry.captureException(error);
        return res.status(400).send({
          status: false,
          message: error.message,
        });
  }
}

module.exports = {
  getUserInbox,
  getUserInboxComment,
  createInbox,
};
