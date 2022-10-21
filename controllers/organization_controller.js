"use strict";
const db = require("./models");
const Sentry = require("@sentry/node");
const mailgun = require("mailgun-js");
const Organizations = db.organization;
const Users = db.user;
const utils = require("./utils");
const env = process.env.NODE_ENV || "mailserver";
const mailConfig = require(__dirname + "/config/config.json")[env];

const mg = mailgun({
  apiKey: mailConfig.apiKey,
  domain: mailConfig.domain,
});

/// create a new organization
module.exports.createOrganization = async function rootHandler(req, res) {
  try {
    const requestBody = req.body;
    const name = requestBody.name;
    const logo = requestBody.logo;
    const teams = requestBody.teams;

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
    const organizations = await Organizations.create({
      name,
      logo,
      teams,
    });
    if (organizations) {
      await Users.update(
        {
          organizationId: organizations.id,
        },
        {
          where: {
            user_id: token.uid,
          },
        }
      );

      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "Organization has been created.",
          data: organizations,
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Could not create organization",
        }),
      };
    }
  } catch (error) {
    Sentry.captureException(error);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({
        status: false,
        message: error.message,
      }),
    };
  }
};

/// get all organizations
module.exports.getOrganizations = async function rootHandler(req, res) {
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
    const organizations = await Organizations.findAll({
      order: [["id", "DESC"]],
    });
    if (organizations) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "List of all organizations",
          data: organizations,
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
          message: "organizations not found",
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

/// get an organization by id
module.exports.getOrganizationById = async function rootHandler(req, res) {
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
    const organizations = await Organizations.findOne({
      where: {
        id: req.pathParameters.id,
      },
      include: ["members"],
    });
    if (organizations) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "List of all organizations",
          data: organizations,
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
          message: "organizations not found",
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

/// update user team
module.exports.updateUserTeam = async function rootHandler(req, res) {
  const requestBody = req.body;
  const team = requestBody.team;

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
        team: team,
      },
      {
        where: {
          user_id: token.uid,
        },
      }
    );
    console.log(userId, "userId");
    if (userId) {
      const updatedUser = await Users.findOne({
        where: {
          user_id: token.uid,
        },
        include: ["organization"],
      });
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "User information updated",
          data: updatedUser,
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

/// invitation endpoint - new members are added by the creator by email invitation
module.exports.inviteMembers = async function rootHandler(req, res) {
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
    const emails = requestBody.emails;
    for (const email in emails) {
      const data = {
        from: "Tasky Admin <postmaster@sandbox91cecc1fa57041c3820f03710bd133e0.mailgun.org>",
        to: email,
        subject: "Your Tasky Invitation is ready!",
        text: "You are invited to join Tasky app.", //Todo: add email invitation template
      };

      if (email === emails.length - 1) {
        const isSent = await mg.messages().send(data);
        if (isSent) {
          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            body: JSON.stringify({
              status: true,
              message: "Invitation sent!",
            }),
          };
        } else {
          await mg.messages().send(data);
        }
      }
    }
  } catch (error) {
    Sentry.captureException(error);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({
        status: false,
        message: error.message,
      }),
    };
  }
};

/// list user in an organization
module.exports.listMembers = async function rootHandler(req, res) {
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

    const users = await Users.findAll({
      where: {
        organizationId: req.pathParameters.organizationId,
      },
      attributes: {
        exclude: ["auth_token"], ///remove auth_token from the results
      },
    });

    if (users) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "Users in the organization",
          data: users,
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
          message: "users not found",
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
