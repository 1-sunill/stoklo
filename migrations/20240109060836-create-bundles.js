"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Bundles", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID, // Use UUID data type
        defaultValue: Sequelize.UUIDV4, // Generate a UUID on insert
      },
      bundleZohoId: {
        type: Sequelize.STRING,
      },
      vendorId: {
        type: Sequelize.INTEGER,
      },
      bundleName: {
        type: Sequelize.STRING,
      },
      bundlePrice: {
        type: Sequelize.DECIMAL(10, 2),
      },
      discountPrice: {
        type: Sequelize.DECIMAL(10, 2),
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "1=>active,0=>inActive",
      },
      noOfStock: {
        type: Sequelize.INTEGER,
      },
      productCount: {
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
    await queryInterface.dropTable("Bundles");
  },
};
