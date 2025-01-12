"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Home extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Home.hasMany(models.CatgoryWithProduct, {
        sourceKey:"categoryId",
        foreignKey: "catId",
        as: "relatedData",
      });
    }
  }
  Home.init(
    {
      order: DataTypes.INTEGER,
      name: DataTypes.STRING,
      status: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Home",
    }
  );
  return Home;
};
