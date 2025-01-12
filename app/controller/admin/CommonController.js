const db = require("../../../models/");
const { success, serverError, validateFail } = require("../../helper/response");
const { fn, col, Op } = require("sequelize");
const { Validator, assert } = require("node-input-validator");
const { $Command } = require("@aws-sdk/client-s3");
const { format } = require("date-fns");
const { sequelize } = require("../../../models/");
const {
  HelpSupport,
  Setting,
  CMS,
  RecommendedProducts,
  User,
  OrderProducts,
  Product,
  Orders,
  Cart,
} = db;
let baseUrl = process.env.APP_URL;

module.exports = {
  helpSupportList: async (req, res) => {
    try {
      const request = req.query;
      const search = request.search ? request.search : "";

      const page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

      const offset = (page - 1) * pageSize;

      let parms = {};

      if (search) {
        parms = {
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              email: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        };
      }

      const helpSupport = await HelpSupport.findAll({
        where: parms,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const newData = {
        count: await HelpSupport.count({
          where: parms,
        }),
        data: helpSupport,
      };
      return success(res, "Help support listed successfully.", newData);
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
  //Manage amount of (Refer And Earn,Cashback,Onboarding Bonus,Delivary Charges)
  setting: async (req, res) => {
    try {
      const settingData = await Setting.findAll();
      return success(res, "Data listed successfully", settingData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  //update setting data
  updateSettingData: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const {
        id,
        title,
        amount,
        percentage,
        minCartValue,
        expiryDate,
        type,
        noOfDays,
      } = req.body;

      const existingSetting = await Setting.findByPk(id);

      if (!existingSetting) {
        return serverError(res, "Setting not found");
      }
      // Get the current date
      const currentDate = new Date();

      if (noOfDays) {
        // Add days to the current date
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + parseInt(noOfDays));
        const formattedDate = format(newDate, "yyyy-MM-dd HH:mm:ss");
        if (existingSetting.id == 2) {
          await existingSetting.update({
            amount,
            expiryDate: formattedDate,
            noOfDays,
          });
        }
        if (existingSetting.id == 1) {
          await existingSetting.update({
            amount,
            expiryDate: formattedDate,
            noOfDays,
          });
        }
        if (existingSetting.id == 3) {
          await existingSetting.update({
            amount,
            expiryDate: formattedDate,
            noOfDays,
          });
        }
      }

      // Update the fetched Setting
      const updatedSetting = await existingSetting.update({
        title,
        amount,
        percentage,
        minCartValue,
        expiryDate,
        type,
      });
      return success(res, "Data updated successfully.", updatedSetting);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error");
    }
  },
  //update setting data status
  updateSettingStatus: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const findData = await Setting.findByPk(req.body.id);

      if (!findData) {
        return failed(res, "Data not found.");
      }

      findData.status = findData.status === 0 ? 1 : 0;
      await findData.save();

      return success(res, "Status updated successfully.", findData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  //Cms
  cmsList: async (req, res) => {
    try {
      const cms = await CMS.findAll();
      return success(res, "Data fetched successfully.", cms);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  updateCms: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const findData = await CMS.findByPk(req.body.id);

      if (!findData) {
        return failed(res, "Data not found.");
      }
      let reqData = {
        title: req.body.title,
        description: req.body.description,
      };
      await findData.update(reqData);
      return success(res, "Data updated successfully.");
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  detailCms: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const findData = await CMS.findByPk(req.query.id);

      if (!findData) {
        return failed(res, "Data not found.");
      }

      return success(res, "Data fetched successfully.", findData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  orderHelpSupportList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let parms = { type: 2 };

      if (search) {
        parms = Object.assign(parms, {
          [Op.or]: [
            {
              email: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      const help = await HelpSupport.findAll({
        where: parms,
        attributes: [
          "id",
          "userId",
          "name",
          "email",
          "phone",
          "bussinessName",
          "description",
          "orderId",
          [fn("CONCAT", baseUrl, "uploads/images/", col("image")), "image"],
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      const responseData = {
        count: await HelpSupport.count({
          where: parms,
        }),
        help: help,
      };
      return success(res, "Data fetched successfuly.", responseData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  //Dashboard
  dashboard: async (req, res) => {
    try {
      //Total user register this month data
      const userRegistrationsThisMonth = await User.findAll({
        attributes: [
          [sequelize.literal("DATE(createdAt)"), "registrationDate"],
          [sequelize.fn("count", sequelize.col("id")), "registrationCount"],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
            [Op.lt]: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
        group: [sequelize.literal("DATE(createdAt)")],
        order: [sequelize.literal("DATE(createdAt)")],
      });

      //Total Top selling products only 5
      const topSellingProduct = await OrderProducts.findAll({
        attributes: [
          "productId",
          [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantitySold"],
        ],
        include: [
          {
            model: Product,
            as: "productDetails",
            attributes: ["productName"],
          },
        ],
        group: ["productId"],
        order: [[sequelize.literal("totalQuantitySold"), "DESC"]],
        limit: 5,
      });
      //Top 5 user to create order and total amount
      const topUsers = await Orders.findAll({
        attributes: [
          [sequelize.col("userId"), "userId"],
          [
            sequelize.fn("SUM", sequelize.col("totalAmount")),
            "totalAmountSpent",
          ],
          [sequelize.fn("COUNT", sequelize.col("Orders.id")), "numberOfOrders"],
        ],
        include: [
          {
            model: User,
            as: "retailerDetails",
            attributes: ["retailerName", "email", "mobileNumber"],
          },
        ],
        group: ["Orders.userId"],
        order: [[sequelize.literal("totalAmountSpent"), "DESC"]],
        limit: 5,
      });

      //Total top Cart amount of one month data
      const topCartData = await Cart.findAll({
        where: {
          createdAt: {
            [Op.gte]: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
            [Op.lt]: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("Cart.createdAt")), "date"],
          [sequelize.fn("COUNT", sequelize.col("*")), "cartCount"],
          [
            sequelize.fn("SUM", sequelize.col("productDetails.netPrice")),
            "totalNetPrice",
          ],
        ],
        group: [
          sequelize.fn("DATE", sequelize.col("Cart.createdAt")),
          "productId",
        ],
        order: [
          [sequelize.fn("DATE", sequelize.col("Cart.createdAt")), "DESC"],
          ["productId", "ASC"],
        ],
        include: [
          {
            model: Product,
            as: "productDetails",
            attributes: ["netPrice"],
          },
        ],
      });

      //Count
      const topCartCount = await Cart.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ),
            [Op.lt]: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              1
            ),
          },
        },
      });

      //Top 5 highest Wallet amount user
      const topWalletUsers = await User.findAll({
        attributes: ["id", "retailerName", "walletAmount"],
        order: [["walletAmount", "DESC"]],
        limit: 5,
      });

      //All Total sale per month
      const totalSale = await Orders.findAll();
      const allTopCart = {
        topCartData,
        topCartCount,
      };
      const dashboard = {
        userRegistrationsThisMonth,
        topSellingProduct,
        topUsers,
        allTopCart,
        topWalletUsers,
      };

      return success(res, "Data fetched successfully.", dashboard);
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error");
    }
  },
};
