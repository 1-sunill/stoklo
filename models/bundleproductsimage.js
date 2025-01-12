"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BundleProductsImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BundleProductsImage.belongsTo(models.Bundles, {
        foreignKey: "bundleId",
        as: "bundle",
      });
    }
  }
  BundleProductsImage.init(
    {
      bundleId: {
        type: DataTypes.UUID,
      },
      bundleImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "BundleProductsImage",
    }
  );
  return BundleProductsImage;
};
