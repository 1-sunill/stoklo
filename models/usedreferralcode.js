"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UsedReferralCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UsedReferralCode.init(
    {
      referralCode: DataTypes.STRING,
      referBy: DataTypes.INTEGER,
      usedBy: DataTypes.INTEGER,
      point: { type: DataTypes.DECIMAL(10, 2) },
    },
    {
      sequelize,
      modelName: "UsedReferralCode",
    }
  );
  return UsedReferralCode;
};
