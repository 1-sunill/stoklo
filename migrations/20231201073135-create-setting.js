"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Settings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      percentage: {
        type: Sequelize.INTEGER,
      },
      minCartValue: {
        type: Sequelize.DECIMAL(10, 2),
      },
      expiryDate: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: "1=>Active,0=>Inactive",
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
    await queryInterface.dropTable("Settings");
  },
};
