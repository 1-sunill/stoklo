"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class HelpSupport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  HelpSupport.init(
    {
      userId: DataTypes.INTEGER,
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      bussinessName: DataTypes.STRING,
      description: DataTypes.STRING,
      orderId: DataTypes.STRING,
      image: DataTypes.STRING,
      type: DataTypes.INTEGER,
      reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "HelpSupport",
    }
  );
  return HelpSupport;
};
