"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("BussinessDetails", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      shopName: {
        type: Sequelize.STRING,
      },
      shopImage: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      panBussiness: {
        type: Sequelize.STRING,
      },
      panName: {
        type: Sequelize.STRING,
      },
      panImage: {
        type: Sequelize.STRING,
      },
      gstNumber: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("BussinessDetails");
  },
};
