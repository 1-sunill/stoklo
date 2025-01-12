'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Banners', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bannerName: {
        type: Sequelize.STRING
      },
      bannerUrl: {
        type: Sequelize.STRING
      },
      bannerImage: {
        type: Sequelize.STRING
      },
      bannerStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue:1,
        comment:"1=>Active, 0=>In-active"
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Banners');
  }
};