'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.TEXT
      },
      due_date: {
        type: Sequelize.STRING
      },
      is_reminder: {
        type: Sequelize.BOOLEAN
      },
      assignees: {
        type: Sequelize.ARRAY(Sequelize.JSONB)
      },
      organizationId: {
        type: Sequelize.INTEGER
      },
      created_by: {
        type: Sequelize.INTEGER
      },
      team: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      priority_level: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  }
};