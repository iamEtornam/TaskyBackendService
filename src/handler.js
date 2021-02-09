'use strict';
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

function verifyToken(token) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token)
        if(decodedToken){
            return true;
        }else{
            return false;
        }
    } catch (error) {
        return false;
    }
}

/// verify token code from client and return user data
module.exports.login = async event => {
    const requestBody = JSON.parse(event.body);
    const token = requestBody.token;

try{
    const decodedToken = verifyToken(token)
    if(decodedToken){
        const uid = decodedToken.uid;
//get user data from database



        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            body: JSON.stringify({
                status: true,
                message: 'Authentication successful',
                data: {
                    name: decodedToken.name,
                    picture:decodedToken.picture,
                    user_id:decodedToken.user_id,
                    email:decodedToken.email
                }
            }),
        };
    }else {
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
}catch (e) {
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