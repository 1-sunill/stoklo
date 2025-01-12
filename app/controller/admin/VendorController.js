const Vendor = require("../../../models").Vendor;
const { Validator } = require("node-input-validator");
const { Op, fn, col } = require("sequelize");
const {
  serverError,
  validateFail,
  success,
  failed,
} = require("../../helper/response");
const { aws } = require("../../helper/aws");
let baseUrl = process.env.APP_URL;

//Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      name: "required",
      email: "required",
      mobileNumber: "required",
      address: "required",
      facilityDetails: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let request = req.body;
    const vendorCheck = await Vendor.findOne({
      where: {
        [Op.or]: [
          { email: request.email },
          { mobileNumber: request.mobileNumber },
        ],
      },
    });
    if (vendorCheck) {
      return failed(res, "Vendor already exist.");
    }
    let reqData = {
      name: request.name,
      email: request.email,
      mobileNumber: request.mobileNumber,
      address: request.address,
      facilityDetails: request.facilityDetails,
      // certificate: request.certificate,
    };
    if (req.files && req.files.certificate) {
      let certificateFileName = await aws(req.files.certificate, "vendor");
      reqData = Object.assign(reqData, {
        certificate: certificateFileName.Location,
      });
    }
    const saveData = await Vendor.create(reqData);
    return success(res, "Vendor saved successfully.", saveData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//List of vendors
exports.listVendor = async (req, res) => {
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
            name: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      });
    }
    const vendorList = await Vendor.findAndCountAll({
      where: parms,
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    return success(res, "Vendor listed successfully.", vendorList);
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//Edit Vendors
exports.editVendor = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let request = req.body;
    let checkVendor = await Vendor.findByPk(request.id);
    if (!checkVendor) {
      return failed(res, "Vendor not exist.");
    }
    const vendorCheck = await Vendor.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { email: request.email },
              { mobileNumber: request.mobileNumber },
            ],
          },
          {
            id: {
              [Op.not]: request.id,
            },
          },
        ],
      },
    });

    if (vendorCheck) {
      return failed(res, "Vendor already exist.");
    }
    const reqData = {
      name: request.name,
      email: request.email,
      mobileNumber: request.mobileNumber,
      address: request.address,
      facilityDetails: request.facilityDetails,
      // certificate: request.certificate,
    };
    if (req.files && req.files.certificate) {
      let shopImageFileName = await aws(req.files.certificate, "vendor");
      console.log(shopImageFileName.Location);
      reqData.certificate = shopImageFileName.Location;
    }
    const updateData = await checkVendor.update(reqData);
    return success(res, "Vendor updated successfully.", updateData);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};

//Details vendor
exports.detailVendor = async (req, res) => {
  try {
    const validate = new Validator(req.query, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let request = req.query;
    let checkVendor = await Vendor.findOne({
      where: { id: request.id },
      attributes: [
        "id",
        "name",
        "email",
        "address",
        "facilityDetails",
        "mobileNumber",
        "certificate",
      ],
    });
    if (!checkVendor) {
      return failed(res, "Vendor not exist.");
    }
    return success(res, "Data fetched successfully.", checkVendor);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};
