const { fn, col, Op, or } = require("sequelize");
const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const {
  sendFCMtoken,
  deductExpireAmount,
  performWalletTransaction,
} = require("../../helper/helpers");
const db = require("../../../models");
const { PointTransaction, WalletTransaction } = db;
const moment = require("moment");
const { Validator } = require("node-input-validator");
const { now } = require("moment");
let baseUrl = process.env.APP_URL;
const axios = require("axios");
const { v4 } = require("uuid");
const crypto = require("crypto");
const { orderShipped, orderDelivered } = require("../../helper/whatsapp");

const {
  Orders,
  User,
  OrderProducts,
  Product,
  ProductImage,
  usedScheme,
  Scheme,
} = db;

module.exports = {
  //Orders lists
  orderList: async (req, res) => {
    try {
      const request = req.query;
      let search = request.search ? request.search : "";
      let orderNo = request.orderNo ? request.orderNo : "";
      const date = request.date ? request.date : "";
      const status = request.status ? request.status : "";
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;

      let parms = {};
      // if (search) {
      //   parms = Object.assign(parms, {
      //       [Op.or]: {
      //         "$retailerDetails.retailerName$": {
      //           [Op.like]: `%${search}%`,
      //         },
      //       }
      //   });
      // }
      if (date) {
        let now = moment(date).format("YYYY-MM-DD");
        parms = Object.assign(parms, {
          [Op.and]: [
            {
              createdAt: {
                [Op.gte]: now + " 00:00:00",
              },
            },
            {
              createdAt: {
                [Op.lte]: now + " 23:59:00",
              },
            },
          ],
        });
      }
      if (status) {
        parms = Object.assign(parms, {
          status: status,
        });
      }
      if (orderNo) {
        parms = {
          orderNo: {
            [Op.like]: `%${orderNo}%`,
          },
        };
      }
      const orders = await Orders.findAll({
        where: parms,
        include: [
          {
            model: User,
            as: "retailerDetails",
            attributes: ["retailerName", "mobileNumber"],
            where: {
              retailerName: {
                [Op.like]: `%${search}%`,
              },
            },
          },
          {
            model: OrderProducts,
            as: "orderDetail",
            attributes: ["quantity"],
          },
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      const data = {
        count: await Orders.count({
          where: parms,
          include: [
            {
              model: User,
              as: "retailerDetails",
              attributes: ["retailerName"],
              where: {
                retailerName: {
                  [Op.like]: `%${search}%`,
                },
              },
            },
          ],
        }),
        rows: orders,
      };
      return success(res, "Orders listed successfully.", data);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  //Order details
  orderDetails: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { id } = req.query;
      const orderDetails = await Orders.findOne({
        where: {
          id: id,
        },
        include: [
          {
            model: OrderProducts,
            as: "orderDetail",
            include: [
              {
                model: Product,
                as: "productDetails",
                include: [
                  {
                    model: ProductImage,
                    as: "productImage",
                    // attributes: [
                    //   [
                    //     fn(
                    //       "CONCAT",
                    //       baseUrl,
                    //       "uploads/images/",
                    //       col("productImage")
                    //     ),
                    //     "productImage",
                    //   ],
                    // ],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            as: "retailerDetails",
            attributes: [
              "retailerName",
              "email",
              "mobileNumber",
              "shopLocation",
            ],
          },
          {
            model: usedScheme,
            as: "usedScheme",
            include: [
              {
                model: Scheme,
                as: "schemeDetail",
              },
              {
                model: Product,
                as: "productDetail",
                
              },
            ],
          },
        ],
      });

      let data = {
        orderSummary: orderDetails,
      };
      return success(res, "Order detail fetched successfully.", data);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  updateOrderStatus: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        orderId: "required",
        status: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { orderId, status, trackingId } = req.body;
      let order = await Orders.findByPk(orderId);
      let userDetail = await User.findByPk(order.userId);
      if (!order) {
        return failed(res, "Order not exist.");
      }

      let reqData = { status: status, trackingId: trackingId };

      // Update reqData based on the status
      let title = `Order id - ${order.orderNo}`;
      let message = "";
      if (status == 4) {
        message = "Your order rejected.";
        reqData.rejectedDate = now();
      } else if (status == 3) {
        await orderDelivered(userDetail, order);

        message = "Your order delivered successfully.";
        reqData.deliveredDate = now();
      } else if (status == 2) {
        await orderShipped(userDetail, order);
        message = "Your order shipped successfully.";
        reqData.shippedDate = now();
      }
      const userId = order.userId;
      sendFCMtoken(
        userId,
        title,
        message,
        1 //NotificationType 0=>admin,1=>order,2=>wallet
      );
      await order.update(reqData);
      return success(res, "Order status updated successfully.");
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  //Cancel order
  cancelOrder: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        orderId: "required",
        cancelReason: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { orderId, cancelReason } = req.body;
      let checkOrder = await Orders.findOne({ where: { id: orderId } });
      if (!checkOrder) {
        return failed(res, "Order no. is not correct.");
      }
      let reqData = {
        cancelReason: cancelReason,
        rejectedDate: now(),
        status: 4,
      };
      if (req.files && req.files.cancelImage) {
        let cancelImageFileName = await aws(
          req.files.cancelImage,
          "cancelProduct"
        );
        reqData = Object.assign(reqData, {
          cancelImage: cancelImageFileName.Location,
        });
      }
      let updatedData = await checkOrder.update(reqData);
      return success(res, "Order cancelled successfully.", updatedData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },

  //refund to wallet
  refundPayment: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        orderId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { orderId } = req.body;
      let checkOrder = await Orders.findOne({ where: { id: orderId } });
      if (!checkOrder) {
        return failed(res, "Order no. is not correct.");
      }

      let phonepeAmt = checkOrder.totalAmount - checkOrder.walletAmount;
      let phonePayRefund;
      if (checkOrder.walletAmount == 0) {
        phonePayRefund = await refundPaymentOnPhonePay(
          phonepeAmt,
          checkOrder.userId,
          checkOrder.transactionId
        );
        return success(res, "Success");
      }
      // console.log(checkOrder.userId);
      // return 1;
      if (phonepeAmt != 0) {
        phonePayRefund = await refundPaymentOnPhonePay(
          phonepeAmt,
          checkOrder.userId,
          checkOrder.transactionId
        );
        if (phonePayRefund == false) {
          return failed(res, "phone pay issue");
        }
      }

      //Get transaction by order id
      let order = `orderId - ${checkOrder.orderNo}`;
      const allOrderWalletTransactions = await PointTransaction.findOne({
        where: { transactionSource: order },
      });
      console.log({ order });
      // console.log(allOrderWalletTransactions); return 1;
      let expiryDate = await WalletTransaction.findOne({
        where: { orderId: order },
        order: [["expiryDate", "desc"]],
      });
      console.log({ expiryDate });
      let newExpiredDate;
      if (expiryDate) {
        if (new Date(expiryDate.expiryDate) < new Date()) {
          // Add 2 weeks to the expiryDate when date is expired
          newExpiredDate = new Date(expiryDate.expiryDate);
          newExpiredDate.setDate(newExpiredDate.getDate() + 14);
          // console.log(newExpiredDate);
        } else {
          newExpiredDate = expiryDate.expiryDate;
        }
      } else {
        return failed(res, "No transactions found.");
      }

      let amount = parseInt(allOrderWalletTransactions.amount);
      //Add refund amount into wallet
      const newTransaction = await performWalletTransaction(
        expiryDate.userId,
        amount,
        1,
        `Amount refunded of ${order}`,
        newExpiredDate,
        `Amount refunded of ${order}`
      );
      // console.log(checkOrder);
      //when amount refunded then amt update 5
      await checkOrder.update({ status: 5 });
      //schedule expire date
      await deductExpireAmount(newExpiredDate);

      return success(res, "Success");
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
};

async function refundPaymentOnPhonePay(amount, userId, transactionId) {
  // const { number, amount, userId } = req.body;
  // Check if the user profile is completed and approved
  console.log(userId);
  // return 1;
  const isUserProfileCompleted = await User.findByPk(userId);
  if (isUserProfileCompleted.isProfileCompleted !== 2) {
    return failed(res, "Your profile is not completed.");
  }

  if (isUserProfileCompleted.isApproved !== 1) {
    return failed(res, "Your profile is completed but not yet approved.");
  }
  let marchentTransectionId = v4();
  console.log({ marchentTransectionId });
  const data = {
    merchantId: "M1EMRUPS2HFB",
    merchantUserId: "M1EMRUPS2HFB",
    merchantTransactionId: marchentTransectionId,
    originalTransactionId: "82d9ea7c-c1a8-447f-a862-255e3963d42c",
    amount: amount * 100,
    redirectUrl: baseUrl + "api/payment/status",
    redirectMode: "POST",
    mobileNumber: isUserProfileCompleted.mobileNumber,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };
  const payload = JSON.stringify(data);
  const payloadMain = Buffer.from(payload).toString("base64");
  const key = "7121aa5d-7e5c-493f-ac91-a091d620bee0";
  const keyIndex = 2; // key index 2
  const string = payloadMain + "/pg/v1/refund" + key;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;
  const URL = "https://api.phonepe.com/apis/hermes/pg/v1/refund"; //Production
  // const URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/refund"; //UAT Testing

  const options = {
    method: "POST",
    url: URL,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
    },
    data: {
      request: payloadMain,
    },
  };
  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
      return { status: true, message: "success", data: response.data };
    })
    .catch(function (error) {
      console.error(error);
      return { status: false, message: "Internal server error." };
    });
}
