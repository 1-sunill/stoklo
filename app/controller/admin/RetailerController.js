const db = require("../../../models/");
const Retailer = db.User;
const Business = db.BussinessDetail;
const Licence = db.LicenceDetail;
const Ownership = db.OwnershipType;
const Orders = db.Orders;
const DigitalShotBook = db.DigitalShotBook;
const {
  success,
  serverError,
  failed,
  validateFail,
} = require("../../helper/response");
const { Op, fn, col } = require("sequelize");
const moment = require("moment");
const { Validator } = require("node-input-validator");
const { aws } = require("../../helper/aws");
let baseUrl = process.env.APP_URL;

//Ownership list
exports.ownerShipList = async (req, res) => {
  try {
    let ownerShipList = await Ownership.findAll();
    return success(res, "Ownership listed successfully", ownerShipList);
  } catch (error) {
    return serverError(res, "Internal server error");
  }
};
// Retailer list with pagination
exports.retailerList = async (req, res) => {
  try {
    let request = req.query;
    const search = request.search ? request.search : "";
    const date = request.date ? request.date : "";
    const isApprove = request.isApprove ? request.isApprove : "";
    const status = request.status ? request.status : "";
    const profileStatus = request.profileStatus ? request.profileStatus : "";
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const offset = (page - 1) * pageSize;
    const adminId = req.decodedData;

    let parms = {};

    if (search) {
      parms = Object.assign(parms, {
        [Op.or]: [
          {
            retailerName: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            email: {
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

    if (isApprove) {
      parms = Object.assign(parms, {
        isApproved: isApprove,
      });
    }
    if (status) {
      parms = Object.assign(parms, {
        status: status,
      });
    }
    if (profileStatus) {
      parms = Object.assign(parms, {
        isProfileCompleted: profileStatus,
      });
    }

    if (date) {
      let now = moment(date).format("YYYY-MM-DD");
      // let now = moment.tz('Asia/Kolkata').format('YYYY-MM-DD');
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
    // console.log(request.limit);
    let retailers;

    if (adminId.data == 1) {
      // Admin ID is 1, return all retailers
      retailers = await Retailer.findAndCountAll({
        where: parms,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
    } else {
      console.log(Object.keys(search));
      // Admin ID is not 1
      if (Object.keys(parms).length == 0 && Object.keys(search).length === 0) {
        // No search parameters provided, return an empty array
        retailers = { rows: [], count: 0 };
      } else {
        // Search parameters provided, perform the search query
        retailers = await Retailer.findAndCountAll({
          where: parms,
          limit: parseInt(pageSize),
          offset: offset,
          order: [["id", "DESC"]],
        });
      }
    }

    return success(res, "Retailer list fetched successfully.", retailers);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};

//Retailer Details
exports.retailerDetail = async (req, res) => {
  try {
    const { id } = req.query;
    let status = req.query.status ? req.query.status : 0;
    const retailer = await Retailer.findByPk(id, {
      include: [
        {
          model: Business,
          attributes: [
            "id",
            "userId",
            "shopName",
            "type",
            "panBussiness",
            "panName",
            "gstNumber",
            "shopImage",
            "panImage",
            // [
            //   fn("CONCAT", baseUrl, "uploads/images/", col("shopImage")),
            //   "shopImage",
            // ],
            // [
            //   fn("CONCAT", baseUrl, "uploads/images/", col("panImage")),
            //   "panImage",
            // ],
          ],
        },
        {
          model: Licence,
          attributes: [
            "id",
            "userId",
            "approvedLicenceName",
            "licenceNumber",
            "expiryDate",
            "storeImage",
            // [
            //   fn("CONCAT", baseUrl, "uploads/images/", col("storeImage")),
            //   "storeImage",
            // ],
          ],
        },
      ],
    });

    if (retailer) {
      return success(res, "Retailer data", retailer);
    } else {
      return failed(res, "Retailer not found");
    }
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error");
  }
};

//Retailer Status update
exports.retailerStatusUpdate = async (req, res) => {
  try {
    const { id } = req.body;
    const retailer = await Retailer.findByPk(id);
    if (!retailer) {
      return failed(res, "Retailer not found.");
    } else {
      retailer.status = retailer.status === 0 ? 1 : 0;
      retailer.save();
      return success(res, "Status updated successfully.", retailer);
    }
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//retailer details update
exports.retailerUpdate = async (req, res) => {
  try {
    console.log("request data+++=", req.body);
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }

    const { id } = req.body;
    const request = req.body;
    const baseUrl = process.env.APP_URL + "uploads/images/";
    const retailer = await Retailer.findByPk(id);
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }
    //User details
    const reqData = {
      retailerName: request.name,
      secondaryMobileNumber: request.secondaryMobileNumber,
      aadharNumber: request.aadharNumber,
      // email: request.email,
      mobileNumber: request.phoneNumber,
      shopLocation: request.shopLocation,
      referralCode: request.referralCode,
      isWhatsapp: request.isWhatsapp,
      isUpdateOnEmail: request.isUpdateOnEmail,
      language: request.language,
    };
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    if (request.email !== null && request.email.trim().length > 0) {
      // Fix the typo here from reqData.email to request.email
      reqData.email = request.email;

      const useremailcheck = await Retailer.findOne({
        where: {
          email: request.email,
          id: { [Op.not]: id }, // Exclude the user with the specified retailer
        },
      });

      // Check if email already exists for another user
      if (
        useremailcheck &&
        useremailcheck.email &&
        useremailcheck.email.toLowerCase() === request.email.toLowerCase()
      ) {
        return failed(res, "Email already exists for another user.");
      }
    }
    //find by primary key and update reqData
    const user = await Retailer.findByPk(id);
    await user.update(reqData);

    //Business Details
    let bussinessData = {
      shopName: request.shopName,
      type: request.ownershipType,
      panBussiness: request.panBussiness,
      panName: request.panName,
      gstNumber: request.gstNumber,
      isProfileCompleted: 0,
    };

    if (req.files && req.files.shopImage) {
      let shopImageFileName = await aws(req.files.shopImage, "business");
      bussinessData = Object.assign(bussinessData, {
        shopImage: shopImageFileName.Location,
      });
    }
    if (req.files && req.files.panImage) {
      let panImageFileName = await aws(req.files.panImage, "business");
      bussinessData = Object.assign(bussinessData, {
        panImage: panImageFileName.Location,
      });
    }

    let checkUserInBussiness = await Business.findOne({
      where: { userId: id },
    });
    let bussinessDetail;
    if (checkUserInBussiness) {
      bussinessDetail = await checkUserInBussiness.update(bussinessData);
    } else {
      bussinessDetail = await Business.create({
        userId: id,
        ...bussinessData,
      });
    }
    if (bussinessDetail) {
      bussinessDetail = bussinessDetail.get({ plain: true });
      bussinessDetail.panImage = bussinessDetail.panImage
        ? bussinessDetail.panImage
        : "";
      bussinessDetail.shopImage = bussinessDetail.shopImage
        ? bussinessDetail.shopImage
        : "";
    }

    //Licence Details

    // let licenceData = {
    //   licenceNumber: request.licenceNumber,
    //   expiryDate: request.expiryDate,
    // };
    // if (req.files && req.files.storeImage) {
    //   let storeImageFileName = await aws(req.files.storeImage, "licence");
    //   licenceData = Object.assign(licenceData, {
    //     storeImage: storeImageFileName.Key,
    //   });
    // }

    // let checkUserInLicence = await Licence.findOne({
    //   where: { userId: id },
    // });
    // let licenceDetail;
    // if (checkUserInLicence) {
    //   licenceDetail = await checkUserInLicence.update(licenceData);
    // } else {
    //   licenceDetail = await Licence.create({
    //     userId: id,
    //     ...licenceData,
    //     isProfileCompleted: 1,
    //     isApproved: 1,
    //   });
    // }
    const licenceDetail = req.body.licenceDetail ? req.body.licenceDetail : "";
    // const storeImage = req.files?.storeImage || "";
    // const storeImage = Array.isArray(req.files?.storeImage) ? req.files.storeImage : [req.files.storeImage];
    const deleteLicenceId = req.body.licenceIdsToRemove
      ? req.body.licenceIdsToRemove
      : 0;
    // Ensure deleteLicenceId is an array
    const deleteLicenceArrayIndex = Array.isArray(deleteLicenceId)
      ? deleteLicenceId
      : [deleteLicenceId];
    // Convert string indices to numbers
    const licenseIdDelete = deleteLicenceArrayIndex.map((index) =>
      parseInt(index)
    );
    // Check if there are IDs to delete
    if (licenseIdDelete.length > 0) {
      // Destroy entries in the License model based on the array of IDs
      await Licence.destroy({
        where: {
          id: licenseIdDelete,
        },
      });
    }

    let licenseArrayWithThumbs = [];
    if (licenceDetail) {
      const indexNo = req.body.indexNo;

      // Ensure that licenceDetail is an array
      const requestData = Array.isArray(licenceDetail)
        ? licenceDetail
        : JSON.parse(licenceDetail);

      // Convert requestData to an array if it's not already
      const licenseArrayNormalized = Array.isArray(requestData)
        ? requestData
        : [requestData];

      // Ensure storeImagesArrayIndex is an array
      const storeImagesArrayIndex = Array.isArray(indexNo)
        ? indexNo
        : [indexNo];
      // console.log("storeImagesArrayIndex++++++",storeImagesArrayIndex);
      // Convert string indices to numbers
      const licenseImageIndexNumber = storeImagesArrayIndex.map((index) =>
        parseInt(index)
      );

      // console.log("licenseImageIndexNumber", licenseImageIndexNumber);

      for (let i = 0; i < licenseArrayNormalized.length; i++) {
        let licenceDetailArray = licenseArrayNormalized[i];

        // Ensure licenceDetailArray is an object
        if (typeof licenceDetailArray === "string") {
          licenceDetailArray = JSON.parse(licenceDetailArray);
        }

        // Check if the current index needs a thumbnail update
        const needsImageUpdate = licenseImageIndexNumber.includes(i);
        // console.log("needsImageUpdate++++++",needsImageUpdate);
        // console.log("needsImageUpdateIndex++++++",i);

        //chek thum here
        const chapterThumbnailArray =
          req.files && req.files.storeImage
            ? Array.isArray(req.files.storeImage)
              ? req.files.storeImage
              : [req.files.storeImage]
            : [];

        // Get the corresponding thumbnail file
        // const thumbFile =
        // needsImageUpdate && Array.isArray(storeImage) ? storeImage[i] : "";

        const thumbFile =
          needsImageUpdate && chapterThumbnailArray.length > 0
            ? chapterThumbnailArray[licenseImageIndexNumber.indexOf(i)]
            : "";
        // console.log("thumbFile++++++",thumbFile);

        const thumb = thumbFile || "";

        // Upload the thumbnail if it exists
        let thumbUpload = licenceDetailArray.thumb;
        if (thumb) {
          const thumbUpload1 = await aws(thumb, "license");
          thumbUpload = thumbUpload1.Location;
        }
        let checkLicence = await Licence.findOne({
          where: {
            userId: { [Op.ne]: id },
            licenceNumber: licenceDetailArray.licenceNumber,
          },
        });
        if (checkLicence) {
          return failed(
            res,
            `The ${licenceDetailArray.licenceNumber} is already exist.`
          );
        }
        const licenseWithImage = {
          licenceNumber: licenceDetailArray.licenceNumber,
          expiryDate: licenceDetailArray.expiryDate,
          approvedLicenceName: licenceDetailArray.approvedLicenceName,
          userId: id,
          storeImage: thumbUpload,
          isProfileCompleted: 1,
        };

        // Check if the licenceNumber already exists in the database
        const existingLicence = await Licence.findOne({
          where: { id: licenceDetailArray.licenceId },
        });

        if (existingLicence) {
          // Update the existing record
          await Licence.update(licenseWithImage, {
            where: { id: licenceDetailArray.licenceId },
          });
        } else {
          // Insert a new record
          await Licence.create(licenseWithImage);
        }
        // console.log({licenseWithImage})
        licenseArrayWithThumbs.push(licenseWithImage);
        if (user.isProfileCompleted !== 2 && user.isProfileCompleted !== 3) {
          await user.update({ isProfileCompleted: 0, isApproved: 0 });
        }
      }
    } else {
      // console.log("sagsdfasdasdhad",123456)
      licenseArrayWithThumbs = [];
    }

    const data = {
      userDetails: user,
      bussinessDetail: bussinessDetail,
      licenceDetail: licenseArrayWithThumbs,
    };

    // await retailer.update(reqData);
    return success(res, "Retailer data successfully updated.", data);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//retailer requests list
exports.retailerRequestsList = async (req, res) => {
  try {
    let request = req.query;
    const search = req.query.search;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

    const offset = (page - 1) * pageSize;

    const searchRetailer = {
      [Op.or]: [
        {
          retailerName: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          mobileNumber: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    };    
        
    const retailers = await Retailer.findAndCountAll({
      where: {
        [Op.and]: [search ? searchRetailer : {}],
        [Op.or]: [{ isApproved: 0 }, { isAddressRequest: 1 }],
        isApproved: {
          [Op.not]: 2,
        },
      },
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });

    return success(
      res,
      "Retailer requests list fetched successfully.",
      retailers
    );
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//Approve retailer
exports.approveRetailer = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const { id } = req.body;
    const retailer = await Retailer.findByPk(id);
    if (retailer) {
      retailer.update({ isApproved: 1, isProfileCompleted: 2 });
      return success(res, "Retailer Aproved Successfully.", retailer);
    } else {
      return failed(res, "Retailer not found.");
    }
  } catch (error) {
    return serverError(res, "Internal Server error.");
  }
};

//reject retailer
exports.rejectRetailer = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });

    const matched = validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }

    const { id, reason } = req.body;
    const retailer = await Retailer.findByPk(id);
    if (retailer) {
      let reqData;
      if (retailer.isProfileCompleted == 3) {
        reqData = {
          rejectReason: reason,
        };
      }
      if (retailer.isProfileCompleted == 2) {
        reqData = {
          isApproved: 2,
          rejectReason: reason,
        };
      }
      retailer.update(reqData);
      return success(res, "Retailer Rejected Successfully.", retailer);
    } else {
      return failed(res, "Retailer not found.");
    }
  } catch (error) {
    return serverError(res, "Internal Server error.");
  }
};

//Create retailer
exports.createRetailer = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      name: "required",
      // email: "required",
      phoneNumber: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const request = req.body;
    const existingRetailer = await Retailer.findOne({
      where: {
        [Op.or]: [
          { mobileNumber: request.phoneNumber },
          { email: request.email.toLowerCase() },
        ],
      },
    });

    if (existingRetailer) {
      if (existingRetailer.mobileNumber == request.phoneNumber) {
        return failed(res, "Mobile number already exists.");
      } else if (
        existingRetailer.email == request.email.toLowerCase() &&
        request.email !== ""
      ) {
        return failed(res, "Email already exists.");
      }
    }
    const baseUrl = process.env.APP_URL + "uploads/images/";

    //User details
    const reqData = {
      retailerName: request.name,
      secondaryMobileNumber: request.secondaryMobileNumber,
      aadharNumber: request.aadharNumber,
      email: request.email.toLowerCase(),
      mobileNumber: request.phoneNumber,
      shopLocation: request.shopLocation,
      referralCode: request.referralCode,
      isWhatsapp: request.isWhatsapp,
      isUpdateOnEmail: request.isUpdateOnEmail,
      language: request.language,
      isProfileCompleted: 1,
    };

    //find by primary key and update reqData
    const user = await Retailer.create(reqData);

    //Business Details
    let bussinessData = {
      shopName: request.shopName,
      type: request.ownershipType,
      panBussiness: request.panBussiness,
      panName: request.panName,
      gstNumber: request.gstNumber,
    };
    //Shop image
    if (req.files && req.files.shopImage) {
      let shopImageFileName = await aws(req.files.shopImage, "business");
      bussinessData = Object.assign(bussinessData, {
        shopImage: shopImageFileName.Location,
      });
    }
    //Pan image
    if (req.files && req.files.panImage) {
      let panImageFileName = await aws(req.files.panImage, "business");
      bussinessData = Object.assign(bussinessData, {
        panImage: panImageFileName.Location,
      });
    }
    //check bussiness
    let checkUserInBussiness = await Business.findOne({
      where: { userId: user.id },
    });

    //Create or update bussiness details
    let bussinessDetail;
    if (checkUserInBussiness) {
      bussinessDetail = await checkUserInBussiness.update(bussinessData);
    } else {
      bussinessDetail = await Business.create({
        userId: user.id,
        ...bussinessData,
      });
    }
    if (bussinessDetail) {
      bussinessDetail = bussinessDetail.get({ plain: true });
      bussinessDetail.panImage = bussinessDetail.panImage
        ? baseUrl + bussinessDetail.panImage
        : "";
      bussinessDetail.shopImage = bussinessDetail.shopImage
        ? baseUrl + bussinessDetail.shopImage
        : "";
    }

    //Licence Details
    const licenceDetail = req.body.licenceDetail;
    // console.log("requestData++++", licenceDetail);
    // console.log("requestFileData++++", req.files.storeImage);

    // Ensure that licenceDetail is an array
    const requestData = Array.isArray(licenceDetail)
      ? licenceDetail
      : JSON.parse(licenceDetail);

    // Convert requestData to an array if it's not already
    const licenseArrayNormalized = Array.isArray(requestData)
      ? requestData
      : [requestData];

    const requestDataWithImage = [];

    for (let i = 0; i < licenseArrayNormalized.length; i++) {
      let licenceDetailArray = licenseArrayNormalized[i];

      if (typeof licenceDetailArray === "string") {
        licenceDetailArray = JSON.parse(licenceDetailArray);
      }

      // Ensure that req.files.storeImage is an array
      const images = Array.isArray(req.files.storeImage)
        ? req.files.storeImage
        : [req.files.storeImage];
      const storeImg = images[i] || "";

      let storeImage;
      if (storeImg) {
        try {
          const storeImage1 = await aws(storeImg, "license");
          storeImage = storeImage1.Location;
        } catch (error) {
          console.error("Error processing store image:", error);
          // Handle the error as needed
        }
      }

      const licenceWithImage = {
        licenceNumber: licenceDetailArray.licenceNumber,
        expiryDate: licenceDetailArray.expiryDate,
        approvedLicenceName: licenceDetailArray.approvedLicenceName,
        userId: user.id,
        storeImage: storeImage || "", // Assign an empty string if storeImage is undefined
      };

      const insertedLicence = await Licence.create(licenceWithImage);
      requestDataWithImage.push(insertedLicence);
      await user.update({ isProfileCompleted: 2, isApproved: 1 });
    }

    const data = {
      userDetails: user,
      bussinessDetail: bussinessDetail,
      licenceDetail: requestDataWithImage,
    };
    return success(res, "Retailer created successfully.", data);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//user orders detail
exports.userOrderDetail = async (req, res) => {
  try {
    const validate = new Validator(req.query, {
      retailerId: "required",
    });

    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }

    const { retailerId } = req.query;
    const status = req.query.status ? req.query.status : 1;
    let ordersCount = await Orders.count({ where: { userId: retailerId } });

    if (ordersCount === 0) {
      return failed(res, "No orders found");
    }

    let userOrders = await Orders.findAll({
      where: { userId: retailerId, status: status },
    });

    return success(res, "Orders fetched successfully.", userOrders);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    return serverError(res, "Internal server error.");
  }
};

//User delete requests
exports.userDeleteRequest = async (req, res) => {
  try {
    let request = req.query;
    const search = req.query.search;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

    const offset = (page - 1) * pageSize;

    const searchRetailer = {
      [Op.or]: [
        {
          retailerName: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          mobileNumber: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    };
    const deleteRequestList = await Retailer.findAll({
      where: {
        [Op.and]: [search ? searchRetailer : {}],
        [Op.or]: [{ isDeletedRequest: 1 }],
      },
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    const newData = {
      count: await Retailer.count({
        where: {
          [Op.and]: [search ? searchRetailer : {}],
          [Op.or]: [{ isDeletedRequest: 1 }],
        },
      }),
      data: deleteRequestList,
    };
    return success(res, "deleted request fetched sucessfully.", newData);
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//Delete user
exports.userDelete = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      userId: "required",
      deleteReason: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const { userId, deleteReason } = req.body;

    // Find the retailer by ID
    const retailer = await Retailer.findByPk(userId);

    // Check if the retailer exists
    if (!retailer) {
      return failed(res, "Retailer not found.");
    }

    // Soft delete the retailer with a reason using the destroy method
    await retailer.destroy({
      individualHooks: true, // Use individual hooks for the destroy operation
      hooks: true, // Enable global hooks
      returning: false, // Do not return the deleted retailer object
      where: { id: userId }, // Additional where clause to ensure specific user deletion
    });
    await DigitalShotBook.destroy({ where: { id: userId } });
    await retailer.update({ deleteReason: deleteReason });
    return success(res, "Retailer deleted successfully.");
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//Approve user update request
exports.approveUserRequest = async (req, res) => {
  try {
    const validationRules = {
      userId: "required",
    };

    const validate = new Validator(req.body, validationRules);
    const isValidationPassed = await validate.check();

    if (!isValidationPassed) {
      return validateFail(res, validate);
    }
    // Find the retailer by ID
    const retailer = await Retailer.findByPk(req.body.userId);

    if (retailer && retailer.isAddressRequest == 1) {
      retailer.update({
        // isApproved: 1,
        // isProfileCompleted: 2,
        isAddressRequest: 0,
        shopLocation: retailer.newShopLocation,
        newShopLocation: null,
      });
      return success(res, "Retailer Updated Successfully.", retailer);
    } else {
      return failed(res, "Retailer not found.");
    }
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};
