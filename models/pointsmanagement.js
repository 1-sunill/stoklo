'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PointsManagement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PointsManagement.init({
    name: DataTypes.STRING,
    amount:DataTypes.INTEGER,
    status:DataTypes.BOOLEAN,
    expiryDate:DataTypes.DATE
  }, {
    sequelize,
    modelName: 'PointsManagement',
  });
  return PointsManagement;
};