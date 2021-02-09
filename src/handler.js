'use strict';
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports.hello = async event => {
  return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({
        status: true,
        message: 'Data here'
      }),
    };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


module.exports.login = async event => {
    const requestBody = JSON.parse(event.body);
    const token = requestBody.token;

try{
    const decodedToken = await admin.auth().verifyIdToken(token)
    if(decodedToken){
        const uid = decodedToken.uid;
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