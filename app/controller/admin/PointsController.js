const db = require("../../../models/");
const Points = db.PointsManagement;
const DeliveryCharges = db.DeliveryCharges;
const {
  failed,
  success,
  serverError,
  validateFail,
} = require("../../helper/response");
const { Op } = require("sequelize");
const { Validator } = require("node-input-validator");
module.exports = {
  updatePoints: async (req, res) => {
    try {
      const { referAndEarn, onboardingBonus } = req.body;

      if (referAndEarn === undefined && onboardingBonus === undefined) {
        const pointsList = await Points.findAll();
        return success(res, "Points listing", pointsList);
      }

      const whereClause = {
        [Op.or]: [],
      };

      if (referAndEarn !== undefined) {
        whereClause[Op.or].push({ name: referAndEarn });
      }

      if (onboardingBonus !== undefined) {
        whereClause[Op.or].push({ name: onboardingBonus });
      }

      const points = await Points.findOne({ where: whereClause });

      if (!points) {
        return failed(res, "Name not found.");
      }

      let reqData = {
        referAndEarn: referAndEarn,
        onboardingBonus: onboardingBonus,
      };
      await points.update(reqData);

      return success(res, "Points updated successfully.", points);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  //list delivery charges
  listDeliveryCharges: async (req, res) => {
    try {
      const deliveryData = await DeliveryCharges.findAll();
      return success(res, "Delivery charges listed successfully",deliveryData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  //create delivery charges
  createDeliveryCharges: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        minAmount: "required",
        maxAmount: "required",
        amount: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { minAmount, maxAmount, amount } = req.body;
      const reqData = {
        minAmount,
        maxAmount,
        amount,
      };
      await DeliveryCharges.create(reqData);
      return success(res, "Delivery charges cretaed successsfully", reqData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },

  //update delivery charges
  updateDeliveryCharges: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { minAmount, maxAmount, amount, id } = req.body;
      const deliveryCharges = await DeliveryCharges.findByPk(id);
      if (!deliveryCharges) {
        return failed(res, "Delivary charge not found.");
      }
      const reqData = {
        minAmount,
        maxAmount,
        amount,
      };
      await deliveryCharges.update(reqData);
      return success(res, "Delivery charges updated successsfully", reqData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },

  //delete delivery charges
  deleteDeliveryCharges: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const deliveryId = req.params.id;

      const deliveryCharges = await DeliveryCharges.findByPk(deliveryId);

      if (!deliveryCharges) {
        return serverError(res, "Delivery not found.");
      }

      await deliveryCharges.destroy();

      return success(res, "Delivery deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
};
