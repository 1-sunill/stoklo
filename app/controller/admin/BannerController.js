const { Validator } = require("node-input-validator");
const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const { aws } = require("../../../app/helper/aws");
const { Op } = require("sequelize");
const Banner = require("../../../models/").Banner;

//List of banner
module.exports = {
  bannerList: async (req, res) => {
    const baseUrl = process.env.APP_URL + "uploads/images/";
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
              bannerName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      let banners = await Banner.findAll({
        where: parms,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      if (banners && banners.length > 0) {
        banners = banners.map((banner) => {
          const modifiedBanner = banner.get({ plain: true });
          modifiedBanner.bannerImage = modifiedBanner.bannerImage
            ? modifiedBanner.bannerImage
            : "";
          return modifiedBanner;
        });
        let data = {
          count: await Banner.count({
            where: parms,
          }),
          rows: banners,
        };
        return success(res, "Banners list", data);
      } else {
        console.log("No banners found.");
      }
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },

  //Insert new banner
  bannerInsert: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        bannerName: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const request = req.body;
      let reqData = {
        bannerName: request.bannerName,
        bannerUrl: request.bannerUrl,
      };
      if (req.files && req.files.bannerImage) {
        let bannerImageFileName = await aws(req.files.bannerImage, "banner");
        reqData = Object.assign(reqData, {
          bannerImage: bannerImageFileName.Location,
        });
      }
      const insertedBanner = await Banner.create(reqData);
      return success(res, "Banner inserted successfully.", insertedBanner);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },

  //update banner
  updateBanner: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const banner = await Banner.findByPk(req.body.id);
      if (!banner) {
        return failed(res, "Banner not found.");
      } else {
        const request = req.body;
        let reqData = {
          bannerName: request.bannerName,
          bannerUrl: request.bannerUrl,
        };
        if (req.files && req.files.bannerImage) {
          let bannerImageFileName = await aws(req.files.bannerImage, "banner");
          reqData = Object.assign(reqData, {
            bannerImage: bannerImageFileName.Location,
          });
        }

        let updateData = await banner.update(reqData);
        return success(res, "Banner updated successfully.", updateData);
      }
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },

  //update status of banner
  bannerStatus: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const banner = await Banner.findByPk(req.body.id);

      if (!banner) {
        return failed(res, "Banner not found.");
      }

      banner.bannerStatus = banner.bannerStatus === 0 ? 1 : 0;
      await banner.save();

      return success(res, "Status updated successfully.", banner);
    } catch (error) {
      console.error("Internal server error:", error);
      return serverError(res, "Internal server error.");
    }
  },

  //delete Banner
  bannerDelete: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const banner = await Banner.findByPk(req.body.id);

      if (!banner) {
        return failed(res, "Banner not found.");
      }

      await banner.destroy();
      return success(res, "Banner deleted successfully.");
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
};
