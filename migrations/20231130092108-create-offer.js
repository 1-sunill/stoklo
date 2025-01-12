"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Offers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      couponCode: {
        type: Sequelize.STRING,
      },
      couponType: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "1=>Flate,2=>Percentage%",
      },
      couponAmount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      minAmount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      maxAmount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      startDate: {
        type: Sequelize.DATEONLY,
      },
      endDate: {
        type: Sequelize.DATEONLY,
      },
      couponDescription: {
        type: Sequelize.TEXT,
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
    // Define indexes after creating the table
    await queryInterface.addIndex("Offers", ["id"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Offers");
  },
};
