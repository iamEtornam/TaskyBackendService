"use strict";
const db = require("./models");
const Sentry = require("@sentry/node");
const Tasks = db.task;
const Users = db.user;

//create new task
module.exports.createTask = Sentry.AWSLambda.wrapHandler(async (event) => {
  const requestBody = JSON.parse(event.body);
  const description = requestBody.description;
  const due_date = requestBody.due_date;
  const is_reminder = requestBody.is_reminder;
  const assignees = requestBody.assignees;
  const organizationId = requestBody.organization_id;
  const created_by = requestBody.created_by;
  const team = requestBody.team;
  const priority_level = requestBody.priority_level;

  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    const task = await Tasks.create({
      description,
      due_date,
      is_reminder,
      assignees,
      organizationId,
      created_by,
      team,
      priority_level,
    });

    if (task) {
      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "Task created successfully!",
          data: task,
        }),
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "Could not create task",
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
});

//get task by organization id
module.exports.getTasks = Sentry.AWSLambda.wrapHandler(async (event) => {
  try {
    console.log(event.headers);
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );
    if (token == null) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    const tasks = await Tasks.findAll({
      where: {
        organizationId: event.pathParameters.organizationId,
      },
      attributes: {
        exclude: ["auth_token"], ///remove auth_token from the results
      },
      include: ["organization", "creator"],
    });
    if (tasks) {
      const participants = [];
      const allTasks = [];
      console.log(tasks[0].created_by, "tasks");

      for (const iterator of tasks) {
        if (tasks.indexOf(iterator) + 1 < tasks.length) {
          for (const assignee of iterator.assignees) {
            const user = await Users.findOne({
              where: {
                id: assignee,
              },
            });
            console.log(iterator.assignees.indexOf(assignee));
            if (
              iterator.assignees.indexOf(assignee) + 1 <
              iterator.assignees.length
            ) {
              participants.push(user);
            }
          }
          iterator.assignees = participants;
          allTasks.push(iterator);
        }
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "List of tasks for Organization",
          data: allTasks,
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
          message: "No task found",
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

///update task completion
//TODO: send notification to all assignees of changes
module.exports.updateTask = Sentry.AWSLambda.wrapHandler(async (event) => {
  const requestBody = JSON.parse(event.body);
  const status = requestBody.status;
  const description = requestBody.description;
  const due_date = requestBody.due_date;
  const is_reminder = requestBody.is_reminder;
  const assignees = requestBody.assignees;
  const team = requestBody.team;
  const priority_level = requestBody.priority_level;

  try {
    const token = await verifyToken(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization
    );

    console.log(
      event.headers.Authorization === undefined
        ? event.headers.authorization
        : event.headers.Authorization,
      "token"
    );
    if (token == null) {
      return res.status(401).send({
        status: false,
        message: "Token has expired. Logout and Signin again.",
      });
    }

    const task = await Tasks.findOne({
      where: {
        id: event.pathParameters.id,
      },
    });
    if (task) {
      const updatedTask = await task.update({
        status: status || task.status,
        description: description || task.description,
        due_date: due_date || task.due_date,
        is_reminder: is_reminder || task.is_reminder,
        assignees: assignees || task.assignees,
        team: team || task.team,
        priority_level: priority_level || task.priority_level,
      });
      if (updatedTask) {
        const task = await Tasks.findOne({
          where: {
            id: event.pathParameters.id,
          },
        });
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "PATCH, OPTIONS",
          },
          body: JSON.stringify({
            status: true,
            message: "Task updated!",
            data: task,
          }),
        };
      } else {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "PATCH, OPTIONS",
          },
          body: JSON.stringify({
            status: false,
            message: "Could not update task status",
          }),
        };
      }
    } else {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        },
        body: JSON.stringify({
          status: false,
          message: "No task found",
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

///get tasks status count
module.exports.getTaskStatusCount = Sentry.AWSLambda.wrapHandler(
  async (event) => {
    try {
      const token = await verifyToken(
        event.headers.Authorization === undefined
          ? event.headers.authorization
          : event.headers.Authorization
      );
      if (token == null) {
        return res.status(401).send({
          status: false,
          message: "Token has expired. Logout and Signin again.",
        });
      }
      const stats = [];
      const todoTask = await Tasks.count({
        where: {
          created_by: event.pathParameters.userId,
          status: "todo",
        },
      });

      const inProgressTask = await Tasks.count({
        where: {
          created_by: event.pathParameters.userId,
          status: "in progress",
        },
      });

      const completedTask = await Tasks.count({
        where: {
          created_by: event.pathParameters.userId,
          status: "completed",
        },
      });

      stats.push({
        todo: todoTask == null ? 0 : todoTask,
      });
      stats.push({
        in_progress: inProgressTask == null ? 0 : inProgressTask,
      });
      stats.push({
        completed: completedTask == null ? 0 : completedTask,
      });

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify({
          status: true,
          message: "Statistic for Tasks",
          data: stats,
        }),
      };
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
