"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class usedScheme extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      usedScheme.belongsTo(models.Scheme, {
        foreignKey: "schemeId",
        as: "schemeDetail",
      });
      usedScheme.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "productDetail",
      });
    }
  }
  usedScheme.init(
    {
      userId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      schemeId: DataTypes.INTEGER,
      orderId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "usedScheme",
    }
  );
  return usedScheme;
};
