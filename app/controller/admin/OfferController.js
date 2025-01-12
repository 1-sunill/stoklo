const { Validator } = require("node-input-validator");
const { Op } = require("sequelize");
const {
  serverError,
  validateFail,
  failed,
  success,
} = require("../../helper/response");
const Offer = require("../../../models/").Offer;

module.exports = {
  //Create New Offer
  createOffer: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        couponCode: "required",
        couponType: "required",
        minAmount: "required|numeric",
        //  maxAmount: "required|numeric",
        // startDate: "required|date",
        // endDate: "required|date",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const {
        couponCode,
        couponTitle,
        couponType,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        couponInPercent,
        couponAmount,
        couponDescription,
        type,
      } = req.body;

      const checkOffer = await Offer.findOne({
        where: { couponCode: couponCode },
      });

      if (checkOffer) {
        return failed(res, "This offer coupon already exist");
      }

      // Create the offer
      const newOffer = await Offer.create({
        couponCode,
        couponTitle,
        couponType,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        couponInPercent,
        couponAmount,
        couponDescription,
        type, //2 means game management (SPin the wheel)
      });

      return success(res, "Offer created successfully", newOffer);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  //List offers
  offerList: async (req, res) => {
    try {
      const request = req.query;
      let search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

      const offset = (page - 1) * pageSize;
      let params = {};
      if (search) {
        params = {
          [Op.or]: [
            {
              couponCode: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        };
      }
      const Offers = await Offer.findAll({
        where: params,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const newData = {
        count: await Offer.count({ where: params }),
        offers: Offers,
      };
      return success(res, "Offers listed successfully", newData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },

  //Offer Details
  offerDetail: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required|numeric",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let offerDetail = await Offer.findByPk(req.query.id);
      return success(res, "Offer detail fetched successfully.", offerDetail);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  //delete offer
  deleteOffer: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const offerId = req.params.id;

      const offer = await Offer.findByPk(offerId);

      if (!offer) {
        return serverError(res, "Offer not found.");
      }

      await offer.destroy();

      return success(res, "Offer deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },

  //edit offer
  editOffer: async (req, res) => {
    try {
      // Validate request body
      const validationRules = {
        id: "required",
        couponCode: "required",
      };

      const validate = new Validator(req.body, validationRules);
      const isValidationPassed = await validate.check();

      if (!isValidationPassed) {
        return validateFail(res, validate);
      }

      const offerId = req.body.id;

      // Check if the offer with the given ID exists
      const offer = await Offer.findByPk(offerId);

      if (!offer) {
        return notFound(res, "Offer not found.");
      }

      const {
        couponCode,
        couponTitle,
        couponType,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        couponInPercent,
        couponAmount,
        couponDescription,
        type,
      } = req.body;

      // Check if the updated couponCode is unique
      const existingOfferWithCode = await Offer.findOne({
        where: {
          couponCode,
          id: { [Op.not]: offerId },
        },
      });

      if (existingOfferWithCode) {
        return failed(res, "This offer coupon code already exists");
      }

      // Update the offer
      const updatedOffer = await offer.update({
        couponCode,
        couponTitle,
        couponType,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        couponInPercent,
        couponAmount,
        couponDescription,
        type,
      });

      return success(res, "Offer updated successfully.", updatedOffer);
    } catch (error) {
      console.error(error); // Log the error for debugging purposes
      return serverError(res, "Internal server error.");
    }
  },
  statusOffer: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const offer = await Offer.findByPk(req.body.id);

      if (!offer) {
        return failed(res, "offer not found.");
      }

      offer.status = offer.status === 0 ? 1 : 0;
      await offer.save();

      return success(res, "Status updated successfully.", offer);
    } catch (error) {
      console.error("Internal server error:", error);
      return serverError(res, "Internal server error.");
    }
  },

  //List offers of spin the wheel
  spinWheelOfferList: async (req, res) => {
    try {
      const Offers = await Offer.findAll({
        where: { type: 2 },
        order: [["id", "DESC"]],
      });
      const newData = {
        offers: Offers,
      };
      return success(res, "Offers listed successfully", newData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
};
