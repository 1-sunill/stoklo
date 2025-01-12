const {
  serverError,
  success,
  failed,
  validateFail,
} = require("../../helper/response");
const { Training } = require("../../../models/");
const { Validator } = require("node-input-validator");
const { aws } = require("../../../app/helper/aws");

module.exports = {
  addTrainingUrl: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        moduleName: "required",
        description: "required",
        link: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { moduleName, description, link } = req.body;
      let reqData = {
        moduleName,
        description,
        link,
      };
      if (req.files && req.files.thumbnail) {
        let thumbnailFileName = await aws(req.files.thumbnail, "trainigThumbnail");
        reqData = Object.assign(reqData, {
          thumbnail: thumbnailFileName.Location,
        });
      }
      await Training.create(reqData);
      return success(res, "Data added successfully.", reqData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error");
    }
  },
  updateTrainingUrl: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        trainingId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }

      //Check training is exist or not
      const trainingCheck = await Training.findByPk(req.body.trainingId);
      if (!trainingCheck) {
        return failed(res, "Data not found.");
      }
      const { moduleName, description, link } = req.body;
      let reqData = {
        moduleName,
        description,
        link,
      };
      if (req.files && req.files.thumbnail) {
        let thumbnailFileName = await aws(req.files.thumbnail, "trainigThumbnail");
        reqData = Object.assign(reqData, {
          thumbnail: thumbnailFileName.Location,
        });
      }
      await trainingCheck.update(reqData);
      return success(res, "Data updated successfully.", reqData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  trainingList: async (req, res) => {
    try {
      const request = req.query;
      let search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

      const offset = (page - 1) * pageSize;
      const list = await Training.findAll({
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const newData = {
        count: await Training.count(),
        data: list,
      };
      return success(res, "Data fetched successfully.", newData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  deleteTraining: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const trainingId = req.params.id;

      const trainig = await Training.findByPk(trainingId);

      if (!trainig) {
        return failed(res, "trainig not found.");
      }

      await trainig.destroy();

      return success(res, "Training deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
};
