"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class QuikMenu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  QuikMenu.init(
    {
      homeMenuId: DataTypes.INTEGER,
      order: DataTypes.INTEGER,
      name: DataTypes.STRING,
      image: DataTypes.STRING,
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "QuikMenu",
    }
  );
  return QuikMenu;
};
