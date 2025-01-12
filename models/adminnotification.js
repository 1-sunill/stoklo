"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AdminNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AdminNotification.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      type: DataTypes.INTEGER,
      scheduleDate: DataTypes.DATE,
      users: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "AdminNotification",
    }
  );
  return AdminNotification;
};
