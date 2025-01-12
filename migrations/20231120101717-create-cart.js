"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Carts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      productId: {
        type: Sequelize.INTEGER,
      },
      bundleId: {
        type: Sequelize.UUID,
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "1=>Product,2=>BundleProduct	",
      },
      addedBy: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: "0=>User,1=>Admin",
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
    await queryInterface.dropTable("Carts");
  },
};
