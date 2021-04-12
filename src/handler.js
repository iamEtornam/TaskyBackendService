'use strict';
const admin = require("firebase-admin");
const mailgun = require("mailgun-js");
const serviceAccount = require("../serviceAccountKey.json");
const db = require('./models')
const {
    Op
} = require("sequelize");
const Sentry = require("@sentry/serverless");
const Organizations = db.organization;
const Users = db.user;
const Tasks = db.task;
const env = process.env.NODE_ENV || 'mailserver';
const config = require(__dirname + '/config/config.json')[env];

Sentry.AWSLambda.init({
    dsn: config['sentry'].apiKey,
  
    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const mg = mailgun({
    apiKey: config.apiKey,
    domain: config.domain
});


async function verifyToken(authorization) {

    try {
        const result = authorization.split(' ')
        return await admin.auth().verifyIdToken(result[1])
    } catch (error) {
        console.log(error, 'token error')
        return;
    }
}

function updateOrCreate(model, values, condition) {
    return model
        .findOne({
            where: condition
        })
        .then(function (obj) {
            // update
            if (obj)
                return obj.update(values);
            // insert
            return model.create(values);
        })
}

/// verify token code from client and return user data
module.exports.login = Sentry.AWSLambda.wrapHandler(async event => {
    const requestBody = JSON.parse(event.body);
    const token = requestBody.token;

    try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        if (decodedToken) {
            const uid = decodedToken.uid;

            //get user data from database
            const user = await updateOrCreate(Users, {
                name: decodedToken.name,
                picture: decodedToken.picture,
                user_id: uid,
                email: decodedToken.email,
                sign_in_provider: decodedToken.firebase.sign_in_provider,
                auth_token: token
            }, {
                email: decodedToken.email
            })

            if (user) {
                return {
                    statusCode: 201,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    },
                    body: JSON.stringify({
                        status: true,
                        message: 'Authentication successful',
                        data: user
                    }),
                };
            } else {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    },
                    body: JSON.stringify({
                        status: false,
                        message: 'Could not create user',
                        data: decodedToken
                    }),
                };
            }
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Authentication failed.'
                }),
            };
        }
    } catch (e) {
        Sentry.captureException(e);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: e.message
            }),
        };
    }
});

/// create a new organization
module.exports.createOrganization = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const requestBody = JSON.parse(event.body);
        const name = requestBody.name;
        const logo = requestBody.logo;
        const teams = requestBody.teams;

        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const organizations = await Organizations.create({
            name,
            logo,
            teams
        })
        if (organizations) {

            await Users.update({
                organizationId: organizations.id
            }, {
                where: {
                    user_id: token.uid
                }
            })

            return {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'Organization has been created.',
                    data: organizations
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Could not create organization'
                }),
            }
        }

    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})


/// get all organizations
module.exports.getOrganizations = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const organizations = await Organizations.findAll({
            order: [
                ['id', 'DESC'],
            ]
        })
        if (organizations) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'List of all organizations',
                    data: organizations
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'organizations not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})

/// get an organization by id
module.exports.getOrganizationById = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const organizations = await Organizations.findOne({
            where: {
                id: event.pathParameters.id
            },
            include: ["members"],
        })
        if (organizations) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'List of all organizations',
                    data: organizations
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'organizations not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})

/// update user team
module.exports.updateUserTeam = Sentry.AWSLambda.wrapHandler(async event => {
    const requestBody = JSON.parse(event.body);
    const team = requestBody.team;

    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const userId = await Users.update({
            team: team
        }, {
            where: {
                user_id: token.uid
            }
        })
        console.log(userId, 'userId');
        if (userId) {
            const updatedUser = await Users.findOne({
                where: {
                    user_id: token.uid
                },
                include: ["organization"],
            })
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'User information updated',
                    data: updatedUser
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'user not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})

/// invitation endpoint - new members are added by the creator by email invitation
module.exports.inviteMembers = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }

        const requestBody = JSON.parse(event.body);
        const emails = requestBody.emails;
        for (const email in emails) {
            const data = {
                from: "Tasky Admin <postmaster@sandbox91cecc1fa57041c3820f03710bd133e0.mailgun.org>",
                to: email,
                subject: "Your Tasky Invitation is ready!",
                text: "You are invited to join Tasky app." //Todo: add email invitation template
            };

            if (email === (emails.length - 1)) {
                const isSent = await mg.messages().send(data)
                if (isSent) {
                    return {
                        statusCode: 200,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        },
                        body: JSON.stringify({
                            status: true,
                            message: 'Invitation sent!'
                        }),
                    };
                } else {
                    await mg.messages().send(data)
                }
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})


module.exports.updateUserToken = Sentry.AWSLambda.wrapHandler(async event => {
    const requestBody = JSON.parse(event.body);
    const fcm_token = requestBody.fcm_token;

    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const userId = await Users.update({
            fcm_token: fcm_token
        }, {
            where: {
                user_id: token.uid
            }
        })
        console.log(userId, 'userId');
        if (userId) {

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'User token updated'
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'user not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})


/// update user INFORMATION
module.exports.getUserInformation = Sentry.AWSLambda.wrapHandler(async event => {

    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const user = await Users.findOne({
            where: {
                user_id: token.uid
            },
            include: ["organization"],
        })
        if (user) {

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'User information',
                    data: user
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'user not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }
})

/// list user in an organization
module.exports.listMembers = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }

        const users = await Users.findAll({
            where: {
                organizationId: event.pathParameters.organizationId
            },
            attributes: {
                exclude: ['auth_token'] ///remove auth_token from the results
            },
        })

        if (users) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'Users in the organization',
                    data: users
                }),
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'users not found'
                }),
            }
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        }
    }
})


//create new task
module.exports.createTask = Sentry.AWSLambda.wrapHandler(async event => {
    const requestBody = JSON.parse(event.body);
    const description = requestBody.description;
    const due_date = requestBody.due_date;
    const is_reminder = requestBody.is_reminder;
    const assignees = requestBody.assignees;
    const organizationId = requestBody.organization_id;
    const created_by = requestBody.created_by;
    const team = requestBody.team;
    const priority_level = requestBody.priority_level

    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }

        const task = await Tasks.create({
            description,
            due_date,
            is_reminder,
            assignees,
            organizationId,
            created_by,
            team,
            priority_level
        })

        if (task) {
            return {
                statusCode: 201,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'Task created successfully!',
                    data: task
                }),
            };
        } else {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Could not create task'
                }),
            };
        }

    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        };
    }

})


//get task by organization id
module.exports.getTasks = Sentry.AWSLambda.wrapHandler(async event => {
    try {

        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }

        const tasks = await Tasks.findAll({
            where: {
                organizationId: event.pathParameters.organizationId
            },
            attributes: {
                exclude: ['auth_token'] ///remove auth_token from the results
            },
            include: ["organization", "creator"],
        })
        if (tasks) {
            const participants = [];
            const allTasks = [];
            console.log(tasks[0].created_by, 'tasks');

            for (const iterator of tasks) {
                if ((tasks.indexOf(iterator) + 1) < tasks.length) {
                    for (const assignee of iterator.assignees) {
                        const user = await Users.findOne({
                            where: {
                                id: assignee
                            }
                        })
                        console.log(iterator.assignees.indexOf(assignee))
                        if ((iterator.assignees.indexOf(assignee) + 1) < iterator.assignees.length) {
                            participants.push(user)
                        }
                    }
                    iterator.assignees = participants
                    allTasks.push(iterator)
                }

            }


            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: true,
                    message: 'List of tasks for Organization',
                    data: allTasks
                }),
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'No task found'
                }),
            };
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        }
    }
})


///update task completion
module.exports.updateTaskStatus = Sentry.AWSLambda.wrapHandler(async event => {
    const requestBody = JSON.parse(event.body);
    const status = requestBody.status;

    try {

        const token = await verifyToken(event.headers.Authorization)
        console.log(event.headers.Authorization, 'token')
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }

        const task = await Tasks.findOne({
            where: {
                id: event.pathParameters.id
            }
        })
        if (task) {
            const updatedTask = await task.update({
                status: status
            })
            if (updatedTask) {
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                    },
                    body: JSON.stringify({
                        status: true,
                        message: updatedTask
                    }),
                };
            } else {
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                    },
                    body: JSON.stringify({
                        status: false,
                        message: 'Could not update task status'
                    }),
                };
            }
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'No task found'
                }),
            };
        }
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        }
    }
})


///get tasks status count
module.exports.getTaskStatusCount = Sentry.AWSLambda.wrapHandler(async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if (token == null) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                },
                body: JSON.stringify({
                    status: false,
                    message: 'Token has expired. Logout and Signin again.'
                }),
            }
        }
        const stats = []
        const todoTask = await Tasks.count({
            where: {
                created_by: event.pathParameters.userId,
                status: 'todo'
            }
        })

        const inProgressTask = await Tasks.count({
            where: {
                created_by: event.pathParameters.userId,
                status: 'in progress'
            }
        })

        const completedTask = await Tasks.count({
            where: {
                created_by: event.pathParameters.userId,
                status: 'completed'
            }
        })

        stats.push({
            todo: todoTask == null ? 0 : todoTask
        })
        stats.push({
            in_progress: inProgressTask == null ? 0 : inProgressTask
        })
        stats.push({
            completed: completedTask == null ? 0 : completedTask
        })

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: true,
                message: 'Statistic for Tasks',
                data: stats
            }),
        };
    } catch (error) {
        Sentry.captureException(error);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: false,
                message: error.message
            }),
        }
    }
})