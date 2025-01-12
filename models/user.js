"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Define associations
      User.hasOne(models.BussinessDetail, { foreignKey: "userId" });
      User.hasMany(models.LicenceDetail, { foreignKey: "userId" });
      User.hasMany(models.Orders, { foreignKey: "userId" });
      User.hasMany(models.WalletTransaction, {
        foreignKey: "userId",
        as: "walletDetails",
      });
      User.hasMany(models.PointTransaction, {
        foreignKey: "userId",
        as: "pointTranDetails",
      });
    }
  }
  User.init(
    {
      mobileNumber: DataTypes.STRING,
      secondaryMobileNumber: DataTypes.STRING,
      retailerName: DataTypes.STRING,
      aadharNumber: DataTypes.STRING,
      email: DataTypes.STRING,
      shopLocation: DataTypes.STRING,
      referralCode: DataTypes.STRING,
      isWhatsapp: DataTypes.STRING,
      isUpdateOnEmail: DataTypes.STRING,
      language: DataTypes.STRING,
      otp: DataTypes.INTEGER,
      isOtpVerify: DataTypes.INTEGER,
      isProfileCompleted: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      isApproved: DataTypes.INTEGER,
      rejectReason: DataTypes.STRING,
      termCondition: DataTypes.STRING,
      walletAmount: DataTypes.INTEGER,
      isDeletedRequest: DataTypes.INTEGER,
      isNotification: DataTypes.INTEGER,
      deleteReason: DataTypes.STRING,
      fcmToken: DataTypes.STRING,
      newShopLocation: DataTypes.TEXT,
      isAddressRequest:DataTypes.INTEGER,
      schemeEarn: { type: DataTypes.DECIMAL(10, 2) },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      paranoid: true, // Enable soft deletes
    }
  );
  return User;
};
