# TaskyBackendService
This is the backend service for the [Tasky app](https://github.com/RegNex/Tasky-Mobile-App) platform. This is a serverless app written in nodejs.

## Requirements
1. Nodejs 
2. AWS Account or any other serverless function hosting solution
3. Firebase for Auth
4. Knowledge in Sequelize
5. PostgreSQL or RDS on AWS

## Configuration
1. Create a firebase project and add a ```service Account key``` to the root of the project
2. Rename ```config.example.json``` to ```config.json``` and provide your database credentails

## To Run and Deploy
To run offline the service assuming you already have [serverless](https://www.serverless.com/framework/docs/getting-started/) and [aws cli](https://aws.amazon.com/cli/) setup;

```sls offline```

To deploy
```sls deploy```