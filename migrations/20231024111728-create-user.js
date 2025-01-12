"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      mobileNumber: {
        type: Sequelize.STRING,
      },
      otp: {
        type: Sequelize.STRING,
      },
      retailerName: {
        type: Sequelize.STRING,
      },
      aadharNumber: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      phoneNumber: {
        type: Sequelize.STRING,
      },

      isWhatsapp: {
        type: Sequelize.ENUM("0", "1"), //0=>inactive 1=>Active
      },
      isUpdateOnEmail: {
        type: Sequelize.ENUM("0", "1"), //0=>inactive 1=>Active
      },
      isProfileCompleted: {
        type: Sequelize.ENUM("0", "1"), //0=>no 1=>yes
      },
      pushNotification: {
        type: Sequelize.ENUM("0", "1"), //0=>no 1=>yes
      },
      language: {
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
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex("Users", ["deletedAt"]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
