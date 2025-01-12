"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PaymentTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PaymentTransaction.init(
    {
      userId: DataTypes.INTEGER,
      merchantTransactionId: DataTypes.STRING,
      transactionId: DataTypes.STRING,
      amount: DataTypes.DECIMAL(10, 2),
      state: {
        type: DataTypes.ENUM("Pending", "Success", "Failed"),
        defaultValue: "Pending",
      },
      paymentInstrument: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "PaymentTransaction",
    }
  );
  return PaymentTransaction;
};
