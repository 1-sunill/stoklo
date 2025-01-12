"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Admin.hasMany(models.AdminModuleAccess, {
        foreignKey: "adminId",
        as: "subadminDetail",
      });
    }
  }
  Admin.init(
    {
      email: DataTypes.STRING,
      name: DataTypes.STRING,
      profileImg: DataTypes.STRING,
      password: DataTypes.STRING,
      mobile: DataTypes.STRING,
      role: DataTypes.STRING,
      admin: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Admin",
    }
  );
  return Admin;
};
