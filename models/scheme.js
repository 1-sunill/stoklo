"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Scheme extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Scheme.belongsTo(models.Product, {
        foreignKey: "giftProductId",
        targetKey: "id",
        as: "productDetails",
      });
      Scheme.belongsTo(models.Gift, {
        foreignKey: "giftId",
        targetKey: "id",
        as: "giftDetails",
      });
    }
  }
  Scheme.init(
    {
      schemeName: DataTypes.STRING,
      productId: DataTypes.INTEGER,
      giftId: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
      termAndCondition: DataTypes.TEXT,
      noOfProduct: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      giftProductId: DataTypes.INTEGER,
      isSpin: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Scheme",
    }
  );
  return Scheme;
};
