"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Offer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Offer.init(
    {
      couponCode: DataTypes.STRING,
      couponTitle: DataTypes.STRING,
      couponType: DataTypes.INTEGER,
      minAmount: DataTypes.INTEGER,
      maxAmount: DataTypes.INTEGER,
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      couponInPercent: DataTypes.INTEGER,
      couponAmount: DataTypes.INTEGER,
      couponDescription: DataTypes.TEXT,
      status: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Offer",
    }
  );
  return Offer;
};
