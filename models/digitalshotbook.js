"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DigitalShotBook extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DigitalShotBook.belongsTo(models.User, {
        foreignKey: "userId",
        as: "UserDetail",
      });
    }
  }
  DigitalShotBook.init(
    {
      userId: DataTypes.INTEGER,
      shopBookimage: DataTypes.STRING,
      status: DataTypes.INTEGER,
      cartJson: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "DigitalShotBook",
    }
  );
  return DigitalShotBook;
};
