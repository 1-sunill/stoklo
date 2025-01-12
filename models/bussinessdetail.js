"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BussinessDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BussinessDetail.init(
    {
      userId: DataTypes.INTEGER,
      shopName: DataTypes.STRING,
      shopImage: DataTypes.STRING,
      // shopOriginalImg: DataTypes.STRING,
      // panOriginalImg: DataTypes.STRING,
      type: DataTypes.STRING,
      panBussiness: DataTypes.STRING,
      panName: DataTypes.STRING,
      panImage: DataTypes.STRING,
      gstNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "BussinessDetail",
    }
  );
  return BussinessDetail;
};
