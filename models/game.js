"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Game.belongsTo(models.Scheme, {
        foreignKey: "schemeId",
        targetKey: "id",
        as: "schemeDetails",
      });
      Game.belongsTo(models.Offer, {
        foreignKey: "couponCode",
        targetKey: "id",
        as: "offerDetails",
      });
    }
  }
  Game.init(
    {
      name: DataTypes.STRING,
      prize: DataTypes.STRING,
      winningProbability: DataTypes.STRING,
      couponCode: DataTypes.STRING,
      schemeId: DataTypes.INTEGER,
      colorCode: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Game",
      tableName: "Games",
    }
  );
  return Game;
};
