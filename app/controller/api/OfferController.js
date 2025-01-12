const { Validator } = require("node-input-validator");
const { Op } = require("sequelize");
const {
  serverError,
  validateFail,
  failed,
  success,
} = require("../../helper/response");
const db = require("../../../models/");
const Offer = db.Offer;
const Orders = db.Orders;
const UserGameWinning = db.UserGameWinning;

module.exports = {
  //List offers
  offerList: async (req, res) => {
    try {
      const request = req.query;
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      const currentDate = new Date();

      const Offers = await Offer.findAll({
        where: {
          startDate: {
            [Op.lte]: currentDate,
          },
          endDate: {
            [Op.gte]: currentDate,
          },
          status: 1,
          type: 1,
        },
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "desc"]],
      });
      const userId = req.decodedData.userId;
      const winningOffers = await UserGameWinning.findAll({
        where: {
          userId: userId,
          offerId: {
            [Op.ne]: null,
          },
          endDate: {
            [Op.gte]: currentDate,
          },
        },
      });
      const spinOffers = [];
      for (let i = 0; i < winningOffers.length; i++) {
        const data = winningOffers[i];
        // console.log(data.offerId);
        const offers = await Offer.findOne({
          where: {
            id: data.offerId,
            endDate: {
              [Op.gte]: currentDate,
            },
          },
        });

        spinOffers.push(offers);
      }

      const responseOffers = [];

      for (const offer of Offers) {
        const order = await Orders.findOne({
          where: { couponCode: offer.couponCode, userId: userId },
        });

        const isOfferUsed = order ? 1 : 0;

        // Create a new object with offer details and isOfferUsed property
        const responseOffer = {
          ...offer.toJSON(), // Convert Sequelize instance to plain object
          isOfferUsed: isOfferUsed,
        };

        responseOffers.push(responseOffer);
      }
      const mergedOffers = [...spinOffers, ...responseOffers].filter(
        (offer) => offer !== null
      );

      const newData = {
        count: mergedOffers.length,
        offers: mergedOffers,
      };
      return success(res, "offersListed", newData);
    } catch (error) {
      console.log({ error });
      return serverError(res, "internalServerError");
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
      return success(res, "offerDetailSuccess", offerDetail);
    } catch (error) {
      return serverError(res, "internalServerError");
    }
  },
};
