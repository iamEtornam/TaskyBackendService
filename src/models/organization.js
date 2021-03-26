'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class organization extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  organization.init({
    name: DataTypes.STRING,
    logo: DataTypes.STRING,
    teams: DataTypes.ARRAY(DataTypes.STRING)
  }, {
    sequelize,
    modelName: 'organization',
  });
  return organization;
};