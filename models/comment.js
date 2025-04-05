'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      comment.belongsTo(models.inbox, {
        foreignKey: 'inboxId',
        as: 'inbox'
      });
      comment.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  };
  comment.init({
    message: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    like: DataTypes.ARRAY(DataTypes.STRING),
    type: DataTypes.STRING,
    action: DataTypes.STRING,
    inboxId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'comment',
  });
  return comment;
};