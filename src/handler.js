'use strict';
const admin = require("firebase-admin");
const mailgun = require("mailgun-js");
const serviceAccount = require("../serviceAccountKey.json");
const db = require('./models')
const {
    Op
} = require("sequelize");
const Organizations = db.organization;
const Users = db.user;
const Tasks = db.task;
const env = process.env.NODE_ENV || 'mailserver';
const config = require(__dirname + '/config/config.json')[env];

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
module.exports.login = async event => {
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
};

/// create a new organization
module.exports.createOrganization = async event => {
    try {
        const requestBody = JSON.parse(event.body);
        const name = requestBody.name;
        const logo = requestBody.logo;
        const department = requestBody.department;

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
                    message: 'Unauthorized'
                }),
            }
        }
        const organizations = await Organizations.create({
            name,
            logo,
            department
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
}


/// get all organizations
module.exports.getOrganizations = async event => {
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
                    message: 'Unauthorized'
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
}

/// get an organization by id
module.exports.getOrganizationById = async event => {
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
                    message: 'Unauthorized'
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
}

/// update user department
module.exports.updateUserDepartment = async event => {
    const requestBody = JSON.parse(event.body);
    const department = requestBody.department;

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
                    message: 'Unauthorized'
                }),
            }
        }
        const userId = await Users.update({
            department: department
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
}

/// invitation endpoint - new members are added by the creator by email invitation
module.exports.inviteMembers = async event => {
    const requestBody = JSON.parse(event.body);
    const emails = requestBody.emails;
    try {

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
}


/// update user INFORMATION
module.exports.getUserInformation = async event => {

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
                    message: 'Unauthorized'
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
}

/// list user in an organization
module.exports.listMembers = async event => {
    try {
        const users = await Users.findAll({
            where: {
                organizationId: event.pathParameters.organizationId
            }
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
}


//create new task
module.exports.createTask = async event => {
    const requestBody = JSON.parse(event.body);
    const description = requestBody.description;
    const due_date = requestBody.due_date;
    const is_reminder = requestBody.is_reminder;
    const assignees = requestBody.assignees;
    const organization_id = requestBody.organization_id;
    const created_by = requestBody.created_by;
    const department = requestBody.department;

    try {
        const task = await Tasks.create({
            description,
            due_date,
            is_reminder,
            assignees,
            organization_id,
            created_by,
            department
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

}