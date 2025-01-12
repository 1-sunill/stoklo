"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Bundles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Bundles.hasMany(models.BundleProducts, {
        foreignKey: "bundleId",
        as: "bundleProducts",
      });

      Bundles.hasMany(models.BundleProductsImage, {
        foreignKey: "bundleId",
        as: "bundleImages",
      });
      Bundles.belongsTo(models.Vendor, {
        foreignKey: "vendorId",
        as: "vendorDetails",
      });
    }
  }
  Bundles.init(
    {
      id: {
        type: DataTypes.UUID, // Use UUID data type
        defaultValue: DataTypes.UUIDV4, // Generate a UUID on insert
        primaryKey: true,
      },
      bundleZohoId: DataTypes.STRING,
      vendorId: DataTypes.INTEGER,
      productCount: DataTypes.INTEGER,
      bundleName: DataTypes.STRING,
      bundlePrice: { type: DataTypes.DECIMAL(10, 2) },
      discountPrice: { type: DataTypes.DECIMAL(10, 2) },
      status: DataTypes.INTEGER,
      noOfStock: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Bundles",
    }
  );
  return Bundles;
};
