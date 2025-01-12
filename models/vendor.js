"use strict";
const { Model, STRING } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Vendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Vendor.hasMany(models.Product, {
        foreignKey: 'vendorId',
        as: 'products',
      });
    }
  }
  Vendor.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      mobileNumber: DataTypes.STRING,
      address: DataTypes.STRING,
      facilityDetails: DataTypes.STRING,
      certificate: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Vendor",
    }
  );
  return Vendor;
};
