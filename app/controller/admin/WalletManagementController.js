const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const {
  WalletTransaction,
  User,
  PointTransaction,
} = require("../../../models");
const { Op } = require("sequelize");
const {
  performWalletTransaction,
  performOrderWalletTransaction,
  deductExpireAmount,
} = require("../../helper/helpers");
const { Validator } = require("node-input-validator");
const { use } = require("passport");
module.exports = {
  walletList: async (req, res) => {
    try {
      const request = req.query;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      const search = request.search ? request.search : "";
      let parms = {};
      // search by retailer name and mobile number
      if (search) {
        parms = Object.assign(parms, {
          [Op.or]: [
            {
              retailerName: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              mobileNumber: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      const userWallet = await User.findAll({
        where: parms,
        attributes: ["id", "retailerName", "mobileNumber", "walletAmount"],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const resData = {
        userWallet: userWallet,
        count: await User.count(),
      };
      return success(res, "User wallet fetched successfully.", resData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  userWalletDetail: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
      });
      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const { id } = req.query; // Change from req.body to req.query

      // Use findById instead of findOne with where clause
      // const userWalletDetail= await User.findByPk(id, {
      //   include: [
      //     {
      //       model: WalletTransaction,
      //       as: "walletDetails",
      //       order: [["id", "DESC"]],
      //     },
      //   ],
      // });

      const userWalletDetail = await User.findByPk(id, {
        include: [
          {
            model: PointTransaction,
            as: "pointTranDetails",
          },
        ],
        order: [
          [{ model: PointTransaction, as: "pointTranDetails" }, "id", "DESC"],
        ],
      });

      if (!userWalletDetail) {
        return notFound(res, "User not found");
      }

      return success(
        res,
        "User detail fetched successfully.",
        userWalletDetail
      );
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
  //credit  wallet
  creditWallet: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
        amount: "required|numeric",
        expiryDate: "required",
      });
      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }
      //1=>credit(request for admin), 2=>debit(request for admin), 3=>earned, 4=>spent
      const { id, amount, expiryDate, reason } = req.body;
      const newTransaction = await performWalletTransaction(
        id,
        amount,
        1,
        "Admin credit",
        expiryDate,
        reason
      );

      //schedule expire date
      await deductExpireAmount(expiryDate);
      if (newTransaction) {
        return success(res, "Amount credited successfully", newTransaction);
      } else {
        return failed(res, "User not found.");
      }
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
  //debit wallet
  debitWallet: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
        amount: "required|numeric",
      });
      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }
      // 1=>credit(request for admin), 2=>debit(request for admin), 3=>earned, 4=>spent
      const { id, amount, reason } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return failed(res, "User not found.");
      }
      const deductionAmount = parseFloat(amount);
      const currentWalletAmount = parseFloat(user.walletAmount);

      const remainingAmount = Math.max(
        currentWalletAmount - deductionAmount,
        0
      );

      await user.update({ walletAmount: remainingAmount });
      const newTransaction = await performOrderWalletTransaction(
        id,
        amount,
        2,
        "Admin debit",
        reason
      );

      if (newTransaction) {
        return success(res, "Amount debited successfully", newTransaction);
      } else {
        return failed(res, "User not found.");
      }
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
};
