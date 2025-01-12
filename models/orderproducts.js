"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OrderProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      OrderProducts.belongsTo(models.Product, {
        foreignKey: "productId",
        targetKey: "id",
        as: "productDetails",
      });
      OrderProducts.belongsTo(models.Bundles, {
        foreignKey: "bundleId",
        as: "bundleDetails",
      });
    }
  }
  OrderProducts.init(
    {
      orderId: DataTypes.INTEGER,
      orderNo: DataTypes.STRING,
      productId: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
      bundleId: {
        type: DataTypes.UUID,
      },
      amount: { type: DataTypes.DECIMAL(10, 2) },
      quantity: DataTypes.INTEGER,
      totalAmount: {
        type: DataTypes.VIRTUAL,
        get() {
          // Getter method to calculate total amount
          const amount = parseFloat(this.getDataValue("amount"));
          const quantity = this.getDataValue("quantity");
          return (amount * quantity).toFixed(2);
        },
        set(value) {
          // Setter method (if needed)
          throw new Error("Cannot set the total amount directly.");
        },
      },
    },
    {
      sequelize,
      modelName: "OrderProducts",
    }
  );
  return OrderProducts;
};
