"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserGameWinning extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserGameWinning.belongsTo(models.Scheme, {
        foreignKey: "schemeId",
        targetKey: "id",
        as: "schemeDetails",
      });
      UserGameWinning.belongsTo(models.Offer, {
        foreignKey: "offerId",
        targetKey: "id",
        as: "offerDetails",
      });
      UserGameWinning.belongsTo(models.User, {
        foreignKey: "userId",
        as: "retailerDetails",
      });
    }
  }
  UserGameWinning.init(
    {
      userId: DataTypes.INTEGER,
      sliceId: DataTypes.INTEGER,
      offerId: DataTypes.STRING,
      prize: DataTypes.STRING,
      schemeId: DataTypes.STRING,
      sliceName: DataTypes.STRING,
      endDate: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "UserGameWinning",
    }
  );
  return UserGameWinning;
};
