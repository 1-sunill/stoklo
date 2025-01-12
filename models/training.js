"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Training extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Training.init(
    {
      moduleName: DataTypes.STRING,
      description: DataTypes.TEXT,
      link: DataTypes.STRING,
      thumbnail: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Training",
    }
  );
  return Training;
};
