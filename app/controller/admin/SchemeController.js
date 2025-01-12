const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const { Gift, Scheme } = require("../../../models/");
const { aws } = require("../../helper/aws");
const { Validator } = require("node-input-validator");
const { fn, col, Op } = require("sequelize");
let baseUrl = process.env.APP_URL;

module.exports = {
  giftList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let parms = {};

      if (search) {
        parms = Object.assign(parms, {
          [Op.or]: [
            {
              giftName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      const gifts = await Gift.findAll({
        where: parms,
        attributes: [
          "id",
          "giftName",
          "giftUnit",
          "giftPrice",
          "giftImage"
          // [
          //   fn("CONCAT", baseUrl, "uploads/images/", col("giftImage")),
          //   "giftImage",
          // ],
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      const responseData = {
        count: await Gift.count({
          where: parms,
        }),
        gifts: gifts,
      };

      return success(res, "Gift list retrieved successfully.", responseData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  createGift: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        giftName: "required",
        giftUnit: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }

      let reqData = {
        giftName: req.body.giftName,
        giftUnit: req.body.giftUnit,
        giftPrice: req.body.giftPrice,
      };

      if (req.files && req.files.giftImage) {
        let giftImageFileName = await aws(req.files.giftImage, "gift");
        reqData = Object.assign(reqData, {
          giftImage: giftImageFileName.Location,
        });
      }

      await Gift.create(reqData);
      return success(res, "Data added successfully.", reqData);
    } catch (error) {
      console.log(error);

      return serverError(res, "Internal server error.");
    }
  },
  giftDetails: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        giftId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const resData = await Gift.findOne({
        where: { id: req.query.giftId },
        attributes: ["id", "giftName", "giftUnit", "giftImage","giftPrice"],
      });
      return success(res, "Data fetched succesfully.", resData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  updateGift: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        giftId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const gift = await Gift.findByPk(req.body.giftId);
      if (!gift) {
        return failed(res, "Gift not found.");
      } else {
        let reqData = {
          giftName: req.body.giftName,
          giftUnit: req.body.giftUnit,
          giftPrice: req.body.giftPrice,
        };

        if (req.files && req.files.giftImage) {
          let giftImageFileName = await aws(req.files.giftImage, "gift");
          reqData = Object.assign(reqData, {
            giftImage: giftImageFileName.Location,
          });
        }
        await gift.update(reqData);
        return success(res, "Data updated successfully.", reqData);
      }
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
  deleteGift: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const giftId = req.params.id;

      const gift = await Gift.findByPk(giftId);

      if (!gift) {
        return failed(res, "Gift not found.");
      }

      await gift.destroy();

      return success(res, "Gift deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },

  /************ Scheme Management ***************/
  schemeList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let parms = {};

      if (search) {
        parms = Object.assign(parms, {
          [Op.or]: [
            {
              schemeName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      const scheme = await Scheme.findAll({
        where: parms,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      const responseData = {
        count: await Scheme.count({
          where: parms,
        }),
        scheme: scheme,
      };

      return success(res, "Scheme list retrieved successfully.", responseData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  createScheme: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        schemeName: "required",
        // selectProductid: "required",
        type: "required",
        // giftId: "required",
        noOfProduct: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let reqData = {
        schemeName: req.body.schemeName,
        productId: req.body.selectProductid ? req.body.selectProductid : 0,
        giftId: req.body.giftId ? req.body.giftId : 0,
        giftProductId: req.body.giftProductId ? req.body.giftProductId : 0,
        type: req.body.type,
        termAndCondition: req.body.termAndCondition,
        noOfProduct: req.body.noOfProduct,
        isSpin: req.body.isSpin,
      };
      // console.log(reqData);
      // return 1;
      await Scheme.create(reqData);
      return success(res, "Data added successfully.", reqData);
    } catch (error) {
      console.log(error);

      return serverError(res, "Internal server error.");
    }
  },
  schemeDetails: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        schemeId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const resData = await Scheme.findOne({
        where: { id: req.query.schemeId },
      });
      return success(res, "Data fetched succesfully.", resData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  updateScheme: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        schemeId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      console.log("++++++++++", req.body);

      const scheme = await Scheme.findByPk(req.body.schemeId);
      if (!scheme) {
        return failed(res, "Scheme not found.");
      } else {
        let reqData = {
          schemeName: req.body.schemeName,
          productId: req.body.selectProductid,
          giftId: req.body.giftId,
          type: req.body.type,
          giftProductId: req.body.giftProductId ? req.body.giftProductId : 0,
          termAndCondition: req.body.termAndCondition,
          noOfProduct: req.body.noOfProduct,
          isSpin: req.body.isSpin,
        };

        await scheme.update(reqData);
        return success(res, "Data updated successfully.", reqData);
      }
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
  deleteScheme: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const schemeId = req.params.id;

      const scheme = await Scheme.findByPk(schemeId);

      if (!scheme) {
        return failed(res, "Scheme not found.");
      }

      await scheme.destroy();

      return success(res, "Scheme deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
  updateSchemeStatus: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let scheme = await Scheme.findOne({ where: { id: req.body.id } });
      if (!scheme) {
        return failed(res, "Scheme id is not valid.");
      } else {
        scheme.status = scheme.status === 0 ? 1 : 0;
        await scheme.save();
        return success(res, "Status updated successfully.", scheme);
      }
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  spinThwheelSchemeList: async (req, res) => {
    try {
      const scheme = await Scheme.findAll({
        where: { isSpin: 2 },
        order: [["id", "DESC"]],
      });

      const responseData = {
        scheme: scheme,
      };

      return success(res, "Scheme list retrieved successfully.", responseData);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
};
