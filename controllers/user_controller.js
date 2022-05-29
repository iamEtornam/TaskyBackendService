"use strict";
const admin = require("firebase-admin");
const db = require("./models");
const { Op } = require("sequelize");
const Sentry = require("@sentry/serverless");
const Organizations = db.organization;
const Users = db.user;


/// verify token code from client and return user data
const login = async (req, res) => {
  const {token} = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
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

/// create a new organization
module.exports.createOrganization = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const requestBody = JSON.parse(event.body);
      const name = requestBody.name;
      const logo = requestBody.logo;
      const teams = requestBody.teams;

      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Token has expired. Logout and Signin again.",
          }),
        };
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
  }
);

/// get all organizations
module.exports.getOrganizations = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Token has expired. Logout and Signin again.",
          }),
        };
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
  }
);

/// get an organization by id
module.exports.getOrganizationById = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Token has expired. Logout and Signin again.",
          }),
        };
      }
      const organizations = await Organizations.findOne({
        where: {
          id: event.pathParameters.id,
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
  }
);

/// update user team
module.exports.updateUserTeam = Sentry.AWSLambda.wrapHandler(async (event) => {
  const requestBody = JSON.parse(event.body);
  const team = requestBody.team;

  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Token has expired. Logout and Signin again.",
        }),
      };
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
});

/// invitation endpoint - new members are added by the creator by email invitation
module.exports.inviteMembers = Sentry.AWSLambda.wrapHandler(async (event) => {
  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Token has expired. Logout and Signin again.",
        }),
      };
    }

    const requestBody = JSON.parse(event.body);
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
});

module.exports.updateUserToken = Sentry.AWSLambda.wrapHandler(async (event) => {
  const requestBody = JSON.parse(event.body);
  const fcm_token = requestBody.fcm_token;

  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Token has expired. Logout and Signin again.",
        }),
      };
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
});

/// get user INFORMATION
module.exports.getUserInformation = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Token has expired. Logout and Signin again.",
          }),
        };
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
  }
);

/// update user INFORMATION
module.exports.updateUserInformation = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const requestBody = JSON.parse(event.body);
      const name = requestBody.name;
      const email = requestBody.email;
      const phone = requestBody.phone_number;
      const picture = requestBody.picture;

      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "PATCH, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Token has expired. Logout and Signin again.",
          }),
        };
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
  }
);

/// list user in an organization
module.exports.listMembers = Sentry.AWSLambda.wrapHandler(async (event) => {
  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Token has expired. Logout and Signin again.",
        }),
      };
    }

    const users = await Users.findAll({
      where: {
        organizationId: event.pathParameters.organizationId,
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
});


module.exports = {
    login,
}