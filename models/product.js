"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.hasMany(models.ProductImage, {
        foreignKey: "productId",
        as: "productImage",
      });
      Product.hasMany(models.ProductImage, {
        foreignKey: "productId",
        as: "productImageForScheme",
      });
      Product.hasMany(models.Cart, {
        foreignKey: "productId",
        // as: "Product",
      });
      Product.hasOne(models.OrderProducts, {
        foreignKey: "productId",
        as: "orderProductDetails",
      });

      Product.hasMany(models.Cart, {
        foreignKey: "productId",
        as: "cartItems",
      });
      Product.belongsTo(models.Vendor, {
        foreignKey: "vendorId",
        as: "vendorDetails",
      });
      Product.hasMany(models.CatgoryWithProduct, {
        foreignKey: "productId",
        as: "catgoryWithProductDetail",
      });
      Product.belongsTo(models.Scheme, {
        foreignKey: "id",
        targetKey: "productId",
        as: "schemeDetails",
      });
    }
  }
  Product.init(
    {
      productZohoId: DataTypes.STRING,
      productName: DataTypes.STRING,
      vendorId: DataTypes.INTEGER,
      compositionName: DataTypes.STRING,
      units: DataTypes.INTEGER,
      smallestUnit: DataTypes.INTEGER,
      noOfStock: DataTypes.INTEGER,
      margin: DataTypes.STRING,
      marginPerUnit: DataTypes.STRING,
      productComposition: DataTypes.TEXT,
      height: DataTypes.INTEGER,
      width: DataTypes.INTEGER,
      length: DataTypes.INTEGER,
      mrp: DataTypes.INTEGER,
      mrpPerUnit: DataTypes.INTEGER,
      netPrice: DataTypes.INTEGER,
      dimestion: DataTypes.STRING,
      netPricePerUnit: DataTypes.INTEGER,
      productCompanyName: DataTypes.STRING,
      status: DataTypes.INTEGER,
      sku: DataTypes.STRING,
      weight: DataTypes.STRING,
      noOfUnitPerPack: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
