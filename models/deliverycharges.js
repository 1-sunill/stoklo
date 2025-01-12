"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DeliveryCharges extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DeliveryCharges.init(
    {
      minAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      maxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DeliveryCharges",
    }
  );
  return DeliveryCharges;
};
