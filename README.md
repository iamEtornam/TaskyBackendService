# TaskyBackendService
This is the backend service for the [Tasky mobile app](https://github.com/iamEtornam/Tasky-Mobile-App) platform. This is a serverless app written in nodejs.

## Documentation
You can locate the documentation for the web service [here](https://documenter.getpostman.com/view/2978812/TzscomU3)

## Requirements
1. Nodejs
2. Any REST API hosting solution
3. Firebase for Auth
4. Knowledge in Sequelize
5. PostgreSQL database

## Configuration
1. Create a firebase project and add a ```service Account key``` to the root of the project
2. Rename ```config.example.json``` to ```config.json``` and provide your database credentials

## To Run and Deploy
To run development, run
```npm install```
```npm run dev```

To run prod, run
```npm install```
```npm run start```

### To deploy

_depends on your hosting solution_
