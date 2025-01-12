"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Schemes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      schemeName: {
        type: Sequelize.STRING,
      },
      productId: {
        type: Sequelize.INTEGER,
      },
      giftId: {
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "1=>gift,2=>product",
      },
      termAndCondition: {
        type: Sequelize.TEXT,
      },
      noOfProduct: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "1=>active,0=>inActive",
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
    await queryInterface.dropTable("Schemes");
  },
};
