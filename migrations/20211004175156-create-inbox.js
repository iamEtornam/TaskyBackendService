'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inboxes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      userId: {
        type: Sequelize.INTEGER
      },
      due_date: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      team: {
        type: Sequelize.STRING
      },
      like: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      type: {
        type: Sequelize.STRING
      },
      action: {
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
    await queryInterface.dropTable('inboxes');
  }
};