'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      orderNo: {
        type: Sequelize.STRING
      },
      acceptedDate: {
        type: Sequelize.DATE
      },
      rejectedDate: {
        type: Sequelize.DATE
      },
      deliveredDate: {
        type: Sequelize.DATE
      },
      couponCode: {
        type: Sequelize.STRING
      },
      couponAmount: {
        type: Sequelize.DECIMAL(10,2)
      },
      walletAmount: {
        type: Sequelize.DECIMAL(10,2)
      },
      delivaryAmount: {
        type: Sequelize.DECIMAL(10,2)
      },
      gst: {
        type: Sequelize.DECIMAL(10,2)
      },
      itemAmount: {
        type: Sequelize.DECIMAL(10,2)
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10,2)
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:"0=>pending,1=>accept,2=>reject,3=>delivered"
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
    await queryInterface.dropTable('Orders');
  }
};