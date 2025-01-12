"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AdminModuleAccess extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      AdminModuleAccess.belongsTo(models.Module, {
        foreignKey: "moduleId",
        as: "moduleDetails",
      });
    }
  }
  AdminModuleAccess.init(
    {
      adminId: DataTypes.INTEGER,
      moduleId: DataTypes.INTEGER,
      accessId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "AdminModuleAccess",
    }
  );
  return AdminModuleAccess;
};
