"use strict";
const { Model, DECIMAL } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PointTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PointTransaction.init(
    {
      userId: DataTypes.INTEGER,
      transactionType: DataTypes.INTEGER,
      transactionSource: DataTypes.STRING,
      amount: { type: DataTypes.DECIMAL(10, 2) },
      reason: DataTypes.STRING,
      expiryDate: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "PointTransaction",
    }
  );
  return PointTransaction;
};
