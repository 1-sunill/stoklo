'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProductCategory.init({
    categoryName: DataTypes.STRING,
    status:DataTypes.INTEGER,
    activeOnHome:DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductCategory',
  });
  return ProductCategory;
};