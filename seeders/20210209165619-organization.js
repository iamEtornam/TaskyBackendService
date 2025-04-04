'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

     await queryInterface.bulkInsert('organizations', [{
       name: 'Sources Technologies LLC',
       logo: 'https://sourcestechnologies.com/lovable-uploads/7fcd793a-3a48-42d2-8f23-f9a50cbaeb57.png',
       teams: ['Backend','Frontend','Mobile','Business Development'],
       createdAt: new Date(),
       updatedAt: new Date()
     },
    {
     name: 'Drill Beat',
     logo: 'https://images.unsplash.com/photo-1612873649383-edf91f1cf7fe?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1300&q=80',
     teams:['Backend','Frontend','Mobile','Business Development'],
     createdAt: new Date(),
     updatedAt: new Date()
   },
   {
    name: 'Ampa Inc',
    logo: 'https://images.unsplash.com/photo-1612808375797-da7957d683f9?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1300&q=80',
    teams:['Backend','Frontend','Mobile','Business Development'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Codebuster Ltd.',
    logo: 'https://images.unsplash.com/photo-1612813562440-f3f455f77bf7?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1301&q=80',
    teams:['Backend','Frontend','Mobile','Business Development'],
    createdAt: new Date(),
    updatedAt: new Date()
  }], {});
   
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('organizations', null, {});
  }
};
