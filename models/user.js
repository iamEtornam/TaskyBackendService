'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  user.init({
    name: DataTypes.STRING,
    picture: DataTypes.STRING,
    organizationId: DataTypes.INTEGER,
    team: DataTypes.STRING,
    fcm_token: DataTypes.TEXT,
    auth_token: DataTypes.TEXT,
    email: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    user_id: DataTypes.STRING,
    sign_in_provider: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};