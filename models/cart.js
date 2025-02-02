"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Cart.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "productDetails",
      });

      Cart.belongsTo(models.Bundles, {
        foreignKey: "bundleId",
        as: "bundleDetails",
      });
    }
  }
  Cart.init(
    {
      productId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      addedBy: DataTypes.INTEGER,
      bundleId: DataTypes.UUID,
      scheduleId: DataTypes.STRING,
      type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "Cart",
    }
  );
  return Cart;
};
