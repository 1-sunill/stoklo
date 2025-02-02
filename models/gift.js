"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Gift extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Gift.hasOne(models.Scheme, {
        foreignKey: "giftId",
        as: "giftDetails",
      });
    }
  }
  Gift.init(
    {
      giftName: DataTypes.STRING,
      giftUnit: DataTypes.INTEGER,
      giftImage: DataTypes.STRING,
      giftPrice: { type: DataTypes.DECIMAL(10, 2) },
    },
    {
      sequelize,
      modelName: "Gift",
    }
  );
  return Gift;
};
