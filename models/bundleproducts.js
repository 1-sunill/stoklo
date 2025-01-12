"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BundleProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BundleProducts.belongsTo(models.Bundles, {
        foreignKey: "bundleId",
        as: "bundle",
      });
      BundleProducts.belongsTo(models.Product, {
        foreignKey: "productId",
        targetKey: "id",
        as: "productDetails",
      });
    }
  }
  BundleProducts.init(
    {
      bundleId: {
        type: DataTypes.UUID,
      },
      productId: DataTypes.INTEGER,
      qty: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "BundleProducts",
    }
  );
  return BundleProducts;
};
