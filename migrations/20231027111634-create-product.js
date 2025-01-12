"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      productName: {
        type: Sequelize.STRING,
      },
      vendorId: {
        type: Sequelize.INTEGER,
      },
      compositionName: {
        type: Sequelize.STRING,
      },
      units: {
        type: Sequelize.INTEGER,
      },
      noOfStock: {
        type: Sequelize.INTEGER,
      },
      margin: {
        type: Sequelize.STRING,
      },
      marginPerUnit: {
        type: Sequelize.STRING,
      },
      productComposition: {
        type: Sequelize.TEXT,
      },
      height: {
        type: Sequelize.INTEGER,
      },
      width: {
        type: Sequelize.INTEGER,
      },
      length: {
        type: Sequelize.INTEGER,
      },
      mrp: {
        type: Sequelize.INTEGER,
      },
      mrpPerUnit: {
        type: Sequelize.INTEGER,
      },
      netPrice: {
        type: Sequelize.INTEGER,
      },
      netPricePerUnit: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("Products");
  },
};
