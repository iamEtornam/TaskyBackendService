"use strict";
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const db = {};

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DB_USERNAME,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    port: process.env.DB_PORT,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
    ssl: true,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false, // very important
      },
    },
  }
);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.organization = require("./organization.js")(sequelize, Sequelize);
db.user = require("./user.js")(sequelize, Sequelize);
db.task = require("./task.js")(sequelize, Sequelize);
db.inbox = require("./inbox.js")(sequelize, Sequelize);
db.comment = require("./comment")(sequelize, Sequelize);

db.organization.hasMany(db.user, { as: "members" });
db.organization.hasMany(db.task, { as: "tasks" });
db.user.belongsTo(db.organization, {
  foreignKey: "organizationId",
  as: "organization",
});
db.task.belongsTo(db.organization, {
  foreignKey: "organizationId",
  as: "organization",
});
db.task.belongsTo(db.user, {
  foreignKey: "created_by",
  as: "creator",
});

// Let the models handle their own associations through the associate method
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
