'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  task.init({
    description: DataTypes.TEXT,
    due_date: DataTypes.STRING,
    is_reminder: DataTypes.BOOLEAN,
    assignees: DataTypes.ARRAY(DataTypes.JSONB),
    organization_id: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    department: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'task',
  });
  return task;
};