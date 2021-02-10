'use strict';
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
const db = require('./models')
const {
    Op
} = require("sequelize");
const Organizations = db.organization;
const Users = db.user;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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


/// get all organizations
module.exports.getOrganizations = async event => {
    try {
        const token = await verifyToken(event.headers.Authorization)
        if(token == null){
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
        if(token == null){
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
        if(token == null){
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
        const userId = await Users.update({department: department},{
            where: {
                user_id: token.uid
            }
        })
        console.log(userId,'userId');
        if (userId) {
            const updatedUser = await Users.findOne({
                where: {
                    id: userId[0]
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