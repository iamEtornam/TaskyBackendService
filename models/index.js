'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.organization = require("./organization.js")(sequelize, Sequelize);
db.user = require("./user.js")(sequelize, Sequelize);
db.task = require("./task.js")(sequelize, Sequelize);
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
db.inbox = require("./inbox.js")(sequelize, Sequelize);
db.comment = require("./comment")(sequelize, Sequelize);
// db.inbox_comment = require("./inbox_comment")(sequelize, Sequelize);

db.inbox.hasMany(db.comment, { as: "comments" });
db.comment.hasOne(db.inbox, { as: "inbox" });

db.inbox.belongsTo(db.user, { 
  foreignKey: "userId",
  as: "user",
   });
db.comment.belongsTo(db.user, { 
  foreignKey: "userId",
  as: "user",
  });
//   db.user.hasMany(db.inbox, { 
//     foreignKey: "userId",
//     as: "user",
//     });
//     db.user.hasMany(db.comment, { 
//       foreignKey: "userId",
//       as: "user",
//       });
module.exports = db;
