"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CatgoryWithProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CatgoryWithProduct.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "productDetails",
      });
    }
  }
  CatgoryWithProduct.init(
    {
      orderSequence: DataTypes.INTEGER,
      catId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      isChecked: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "CatgoryWithProduct",
    }
  );
  return CatgoryWithProduct;
};
