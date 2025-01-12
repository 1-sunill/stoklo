"use strict";
const { Model, STRING, BOOLEAN } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Orders extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Orders.belongsTo(models.User, {
        foreignKey: "userId",
        as: "retailerDetails",
      });
      Orders.hasMany(models.OrderProducts, {
        foreignKey: "orderId",
        as: "orderDetail",
      });
      Orders.hasMany(models.usedScheme, {
        foreignKey: "orderId",
        as: "usedScheme",
      });
    }
  }
  Orders.init(
    {
      userId: DataTypes.INTEGER,
      orderNo: DataTypes.STRING,
      trackingId: DataTypes.STRING,
      shippedDate: DataTypes.DATE,
      acceptedDate: DataTypes.DATE,
      rejectedDate: DataTypes.DATE,
      deliveredDate: DataTypes.DATE,
      couponCode: DataTypes.STRING,
      cancelReason: DataTypes.STRING,
      cancelDescription: DataTypes.TEXT,
      helpQuery: DataTypes.INTEGER,
      cancelImage: DataTypes.STRING,
      couponAmount: { type: DataTypes.DECIMAL(10, 2) },
      walletAmount: { type: DataTypes.DECIMAL(10, 2) },
      deliveryAmount: { type: DataTypes.DECIMAL(10, 2) },
      gst: { type: DataTypes.DECIMAL(10, 2) },
      itemAmount: { type: DataTypes.DECIMAL(10, 2) },
      refundedAmount: { type: DataTypes.DECIMAL(10, 2) },
      totalAmount: { type: DataTypes.DECIMAL(10, 2) },
      transactionId: DataTypes.STRING,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      address: DataTypes.STRING,
      transactionType:DataTypes.STRING,
      noOfItem: {
        type: DataTypes.VIRTUAL,
        get() {
          const orderDetail = this.getDataValue("orderDetail");
          return orderDetail
            ? orderDetail.reduce(
                (total, product) => total + product.quantity,
                0
              )
            : 0;
          // return this.getDataValue("orderDetail")
          //   ? this.getDataValue("orderDetail").length
          //   : 0;
        },
      },
    },
    {
      sequelize,
      modelName: "Orders",
    }
  );
  return Orders;
};
