const {
  success,
  failed,
  serverError,
  validateFail,
} = require("../../helper/response");
const {
  sendOtp,
  generateRefferCode,
  performWalletTransaction,
  deductExpireAmount
} = require("../../helper/helpers");
const { newUser } = require("../../helper/whatsapp");
const { aws } = require("../../../app/helper/aws");
const db = require("../../../models");
const User = db.User;
const BusinessData = db.BussinessDetail;
const LicenceData = db.LicenceDetail;
const Licence = db.ApprovedLicence;
const Setting = db.Setting;
const UsedReferralCode = db.UsedReferralCode;
const WalletTransaction = db.WalletTransaction;
const PointTransaction = db.PointTransaction;
const { Validator } = require("node-input-validator");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { fn, col, Op, where, literal } = require("sequelize");
let baseUrl = process.env.APP_URL;
let axios = require("axios");
const { response } = require("express");
const { format } = require("date-fns");
const moment = require("moment");

//Login and signup
exports.login = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      mobile_number: "required",
    });
    // console.log(req.body.mobile_number);
    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }
    const randomOtp = Math.floor(1000 + Math.random() * 9000);

    const mobileNumber = req.body.mobile_number;
    // Attempt to find a user by mobile number
    const user = await User.findOne({
      where: { mobileNumber: mobileNumber },
    });

    if (user) {
      if (user.status == 0) {
        return failed(res, "userInactiveContactAdmin");
      }
      //send otp
      await sendOtp(mobileNumber, randomOtp);
      let reqData = {
        otp: randomOtp,
        fcmToken: req.body.fcmToken,
      };
      // User already exists, update the OTP
      await user.update(reqData);
      return success(res, "otpSendSuccess", reqData);
    } else {
      //send otp
      await sendOtp(mobileNumber, randomOtp);
      // Create a new user with the onboarding bonus amount
      const newUser = await User.create({
        mobileNumber,
        otp: randomOtp,
        fcmToken: req.body.fcmToken,
      });
      return success(res, "userCreateAndOtpSend", newUser);
    }
  } catch (error) {
    console.error("Error:", error);
    return failed(res, "An error occurred during login");
  }
};

//Verify otp
exports.verifyOtp = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      mobile_number: "required",
      otp: "required",
    });

    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }

    const mobileNumber = req.body.mobile_number;
    const otp = req.body.otp;

    // Attempt to find a user by mobile number
    const user = await User.findOne({ where: { mobileNumber: mobileNumber } });

    if (!user) {
      return failed(res, "userNotFoundGivenMob");
    }
    if (user.status == 0) {
      return failed(res, "userInactiveContactAdmin");
    }
    if (otp === user.otp) {
      await user.update({ isOtpVerify: 1, otp: "NULL" });
      // Generate a JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY);

      const responseObj = {
        user: user,
        token: token,
      };
      return success(res, "otpVerified", responseObj);
    } else {
      return failed(res, "otpNotValid");
    }
  } catch (error) {
    console.log(error);
    return serverError(res, "internalServerError");
  }
};

//update profile details
exports.updateUserDetails = async (req, res) => {
  try {
    // const validate = new Validator(req.body, {
    // retailerName: "required",
    //   aadharNumber: "required",
    //   email: "required",
    //   phoneNumber: "required",
    //   shopLocation: "required",
    // });
    // const matched = await validate.check();
    // if (!matched) {
    //   return validateFail(res, validate);
    // }
    const userId = req.decodedData.userId;
    const request = req.body;
    const baseUrl = process.env.APP_URL + "uploads/images/";
    // console.log(randomReferralCode); return 1;
    //User details
    const reqData = {
      retailerName: request.retailerName,
      secondaryMobileNumber: request.secondaryMobileNumber,
      aadharNumber: request.aadharNumber,
      email: request.email,
      phoneNumber: request.phoneNumber,
      shopLocation: request.shopLocation,
      isWhatsapp: request.isWhatsapp,
      isUpdateOnEmail: request.isUpdateOnEmail,
      language: request.language,
      termCondition: request.termCondition,
      isProfileCompleted: 1,
    };

    //find by primary key and update reqData
    const user = await User.findByPk(userId);
    if (user.referralCode == null) {
      const randomReferralCode = await generateRefferCode(request.retailerName);
      reqData.referralCode = randomReferralCode;
    }
    //ReferralCode start
    if (request.referralCode) {
      // Check if the referral code is valid
      const isReferralCodeValid = await User.findOne({
        where: { referralCode: request.referralCode },
      });

      if (!isReferralCodeValid) {
        return failed(res, "referralNotFound");
      }

      // Check if the referral code has already been used by the current user
      const isReferralCodeUsed = await UsedReferralCode.findOne({
        where: { referralCode: request.referralCode, usedBy: userId },
      });

      if (isReferralCodeUsed) {
        return failed(res, "usedCode");
      }

      // Find the user ID associated with the referral code
      const referByUser = await User.findOne({
        where: { referralCode: request.referralCode },
      });

      // Create a record in the UsedReferralCode model
      const setting = await Setting.findByPk(1);

      await UsedReferralCode.create({
        referralCode: request.referralCode,
        usedBy: userId,
        referBy: referByUser.id,
        point: setting.amount,
      });
      //Credit user wallet using referral code
      // await WalletTransaction.create({
      //   amount: setting.amount,
      //   afterWalletAmount: setting.amount,
      //   transactionType: 3, // Refer and earn
      //   userId: userId,
      //   transactionSource: "Refer and earn",
      // });
      await performWalletTransaction(
        userId,
        setting.amount,
        1,
        "Refer and earn"
      );
      //Earn to user who refers
      await performWalletTransaction(
        referByUser.id,
        setting.amount,
        1,
        `Referral Code Used by ${request.retailerName}`
      );
    }

    //Referral code end

    if (request.email && request.email != "") {
      let checkEmailExistance = await User.findOne({
        where: {
          email: where(fn("LOWER", col("email")), request.email.toLowerCase()),
          id: {
            [Op.ne]: userId,
          },
        },
      });
      console.log({ checkEmailExistance });
      if (checkEmailExistance) {
        return failed(res, "emailExist");
      }
    }

    await user.update(reqData);

    //Business Details
    let bussinessData = {
      shopName: request.shopName,
      type: request.type,
      panBussiness: request.panBussiness,
      panName: request.panName,
      gstNumber: request.gstNumber,
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
    let checkUserInBussiness = await BusinessData.findOne({
      where: { userId: userId },
    });
    let bussinessDetail;
    if (checkUserInBussiness) {
      bussinessDetail = await checkUserInBussiness.update(bussinessData);
    } else {
      bussinessDetail = await BusinessData.create({
        userId: userId,
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
    const data = {
      userDetails: user,
      bussinessDetail: bussinessDetail,
    };
    let currentTime = new Date();
    let scheduleDateTime = moment(currentTime, "YYYY-MM-DD HH:mm");
    let timeAfter5Minutes = moment(scheduleDateTime).add(5, "minutes");

    await newUser(userId, timeAfter5Minutes.format("YYYY-MM-DD HH:mm"));
    success(res, "personalDetailSaved", data);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//insert licence
exports.insertLicence = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const licenceDetail = req.body.licenceDetail;
    console.log("requestData++++", licenceDetail);
    console.log("requestFileData++++", req.files.storeImage);

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
      let checkLicence = await LicenceData.findOne({
        where: {
          userId: { [Op.ne]: userId },
          licenceNumber: licenceDetailArray.licenceNumber,
        },
      });
      if (checkLicence) {
        return failed(
          res,
          `The ${licenceDetailArray.licenceNumber} is already exist.`
        );
      }
      const licenceWithImage = {
        licenceNumber: licenceDetailArray.licenceNumber,
        expiryDate: licenceDetailArray.expiryDate,
        approvedLicenceName: licenceDetailArray.approvedLicenceName,
        userId: userId,
        storeImage: storeImage || "", // Assign an empty string if storeImage is undefined
      };

      const insertedLicence = await LicenceData.create(licenceWithImage);
      requestDataWithImage.push(insertedLicence);
    }
    await User.update(
      { isProfileCompleted: 2 },
      {
        where: {
          id: userId,
        },
      }
    );
    // Respond with a success message and the inserted data
    return success(res, "licenceProcess", requestDataWithImage);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

//licence list
exports.licenceList = async (req, res) => {
  try {
    const licence = await Licence.findAll();
    return success(res, "Licence list", licence);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//Onoarding bonus
exports.onBoardingBonus = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const setting = await Setting.findByPk(2);

    if (!setting) {
      return notFound(res, "Setting not found");
    }
    if (setting.status == 0) {
      return failed(res, "Onboarding status disabled.");
    }
    // Calculate expiry date
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    console.log(expiryDate);
    console.log(parseInt(setting.noOfDays));

    expiryDate.setDate(currentDate.getDate() + parseInt(setting.noOfDays));
    const formattedExpiryDate = format(expiryDate, "yyyy-MM-dd HH:mm:ss");
    await deductExpireAmount(formattedExpiryDate);

    // Update the user's wallet amount
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return notFound(res, "User not found");
    }
    const walletTransactions = await WalletTransaction.findAll({
      where: {
        userId: userId,
      },
      order: [["id", "DESC"]],
      limit: 1,
    });
    const beforeWalletAmount = walletTransactions.length
      ? walletTransactions[0].afterWalletAmount
      : 0;
    const afterWalletAmount =
      parseFloat(beforeWalletAmount) + parseFloat(setting.amount);
    await user.update({ walletAmount: afterWalletAmount });
    // Create a wallet transaction record
    await WalletTransaction.create({
      amount: setting.amount,
      beforeWalletAmount,
      afterWalletAmount,
      transactionType: 3, // Onboarding bonus type = 3
      userId: userId,
      transactionSource: "OnBoarding Bonus",
      expiryDate: formattedExpiryDate,
    });
    await PointTransaction.create({
      amount: setting.amount,
      transactionType: 1, // Onboarding bonus credit
      userId: userId,
      transactionSource: "OnBoarding Bonus",
      expiryDate: formattedExpiryDate,
    });

    return success(res, "Onboarding bonus added successfully");
  } catch (error) {
    console.error(error);
    return serverError(res, "Internal server error");
  }
};

//Wallet transaction
exports.walletTransactions = async (req, res) => {
  try {
    let request = req.query;
    const userId = req.decodedData.userId;
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const offset = (page - 1) * pageSize;
    let totalWalletAmount = await User.findByPk(userId, {
      attributes: ["walletAmount"],
    });
    let walletTransactions = await PointTransaction.findAll({
      where: { userId: userId },
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    const newData = {
      count: await PointTransaction.count({
        where: { userId: userId },
      }),
      totalWalletAmount,
      walletTransactions,
    };
    return success(res, "Wallet transactions.", newData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error");
  }
};

//User Detail
exports.userDetails = async (req, res) => {
  try {
    const userId = req.decodedData.userId;

    let user = await User.findByPk(userId, {
      include: [
        {
          model: BusinessData,
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
          model: LicenceData,
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
    // Calculate totalEarn
    // const totalEarnResult = await PointTransaction.findOne({
    //   attributes: [[fn("SUM", literal("amount")), "totalEarn"]],
    //   where: {
    //     userId: userId,
    //     transactionType: ["1"],
    //   },
    // });

    // const totalEarn = totalEarnResult
    //   ? totalEarnResult.getDataValue("totalEarn") || 0
    //   : 0;
    const totalEarn = user && user.schemeEarn ? user.schemeEarn : 0;
    // Calculate totalSpent
    const totalSpentResult = await PointTransaction.findOne({
      attributes: [[fn("SUM", literal("amount")), "totalSpent"]],
      where: {
        userId: userId,
        transactionType: ["2"],
      },
    });
    const totalSpent = totalSpentResult
      ? totalSpentResult.getDataValue("totalSpent") || 0
      : 0;
    const referData = await UsedReferralCode.findOne({
      where: { usedBy: userId },
      attributes: ["referBy", "point"],
    });
    // console.log(referData);
    // console.log("++++", user.referralCode);
    let usedReferData = null;
    if (referData) {
      usedReferData = await User.findOne({
        where: { id: referData.referBy },
        attributes: ["retailerName", "referralCode"],
      });
      usedReferData.dataValues.point = referData.point;
    }

    // console.log(usedReferData);
    const userData = {
      ...user.get({ plain: true }), // Convert Sequelize instance to plain object
      totalEarn,
      totalSpent,
      usedReferData,
    };
    // console.log(user);
    return success(res, "userDetail", userData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//Delete account request
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const user = await User.findByPk(userId);
    const reqData = {
      isDeletedRequest: 1,
      deleteReason: req.body.reason,
    };
    await user.update(reqData);
    return success(res, "requestSubmit");
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//Request for address change
exports.sendRequestForUpdate = async (req, res) => {
  try {
    const validationRules = {
      newShopLocation: "required",
    };

    const validate = new Validator(req.body, validationRules);
    const isValidationPassed = await validate.check();

    if (!isValidationPassed) {
      return validateFail(res, validate);
    }
    const userId = req.decodedData.userId;
    const user = await User.findByPk(userId);
    const reqData = {
      newShopLocation: req.body.newShopLocation,
      // isProfileCompleted: 3, //3=> Reuest for profile update
      isAddressRequest:1
    };
    await user.update(reqData);
    return success(res, "requestSubmit");
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//Profile rejected status
exports.rejectProfileStatus = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const user = await User.findByPk(userId);

    if (user) {
      if (user.isApproved === 2) {
        const data = {
          rejectReason: user.rejectReason,
        };
        return res.json({
          code: 200,
          status: true,
          message: "profileRejcted",
          data: data,
        });
      } else {
        return res.json({
          code: 200,
          status: false,
          message: "Your profile is not rejected.",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return serverError(res, "Internal server error.");
  }
};
