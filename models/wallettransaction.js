"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class WalletTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  WalletTransaction.init(
    {
      userId: DataTypes.INTEGER,
      transactionType: DataTypes.INTEGER,
      amount: DataTypes.INTEGER,
      beforeWalletAmount: DataTypes.INTEGER,
      afterWalletAmount: DataTypes.INTEGER,
      transactionSource: DataTypes.STRING,
      expiryDate: DataTypes.DATE,
      orderId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "WalletTransaction",
    }
  );
  return WalletTransaction;
};
