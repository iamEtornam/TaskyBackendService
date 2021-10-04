'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class inbox_comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  inbox_comment.init({
    inbox: DataTypes.INTEGER,
    comment: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'inbox_comment',
  });
  return inbox_comment;
};