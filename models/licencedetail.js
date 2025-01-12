"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class LicenceDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LicenceDetail.init(
    {
      userId: DataTypes.INTEGER,
      licenceNumber: DataTypes.STRING,
      expiryDate: DataTypes.STRING,
      approvedLicenceName: DataTypes.STRING,
      storeImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "LicenceDetail",
    }
  );
  return LicenceDetail;
};
