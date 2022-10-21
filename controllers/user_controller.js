"use strict";
const db = require("./models");
const Sentry = require("@sentry/node");
const utils = require("./utils");
const Users = db.user;

/// verify token code from client and return user data
module.exports.login = async function rootHandler(req, res) {
  const { token } = req.body;

  try {
    const decodedToken = utils.verifyToken(token);
    if (!decodedToken) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    if (decodedToken) {
      const uid = decodedToken.uid;

      //get user data from database
      const user = await updateOrCreate(
        Users,
        {
          name: decodedToken.name,
          picture: decodedToken.picture,
          user_id: uid,
          email: decodedToken.email,
          sign_in_provider: decodedToken.firebase.sign_in_provider,
          auth_token: token,
        },
        {
          email: decodedToken.email,
        }
      );

      if (user) {
        return res.status(201).json({
          status: true,
          message: "Authentication successful",
          data: user,
        });
      } else {
        return res.status(400).json({
          status: false,
          message: "Could not create user",
          data: decodedToken,
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Authentication failed.",
      });
    }
  } catch (e) {
    Sentry.captureException(e);
    return res.status(400).json({
      status: false,
      message: e.message,
    });
  }
};

/// update user notification token
module.exports.updateUserToken = async function rootHandler(req, res) {
  const requestBody = req.body;
  const fcm_token = requestBody.fcm_token;

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
    const userId = await Users.update(
      {
        fcm_token: fcm_token,
      },
      {
        where: {
          user_id: token.uid,
        },
      }
    );
    console.log(userId, "userId");
    if (userId) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "User token updated",
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "user not found",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

/// get user INFORMATION
module.exports.getUserInformation = async function rootHandler(req, res) {
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
    const user = await Users.findOne({
      where: {
        user_id: token.uid,
      },
      include: ["organization"],
    });
    if (user) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "User information",
          data: user,
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
          message: "user not found",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

/// update user INFORMATION
module.exports.updateUserInformation = async function rootHandler(req, res) {
  try {
    const requestBody = req.body;
    const name = requestBody.name;
    const phone = requestBody.phone_number;
    const picture = requestBody.picture;

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
    const user = await Users.update(
      {
        name: name,
        phone_number: phone,
        picture: picture,
      },
      {
        where: {
          user_id: token.uid,
        },
      }
    );
    console.log(user, "userId");
    if (user) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "User information updated",
          data: user,
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "user not found",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
      },
      body: JSON.stringify({
        status: false,
        message: error.message,
      }),
    };
  }
};
