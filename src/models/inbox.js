'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class inbox extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  inbox.init({
    title: DataTypes.STRING,
    message: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    due_date: DataTypes.DATE,
    status: DataTypes.STRING,
    team: DataTypes.STRING,
    like: DataTypes.ARRAY(DataTypes.STRING),
    type: DataTypes.STRING,
    action: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'inbox',
  });
  return inbox;
};