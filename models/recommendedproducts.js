"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RecommendedProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RecommendedProducts.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "productDetails",
      });
    }
  }
  RecommendedProducts.init(
    {
      productId: DataTypes.INTEGER,
      isChecked: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "RecommendedProducts",
    }
  );
  return RecommendedProducts;
};
