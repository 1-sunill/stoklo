const db = require("../../../models");
const OwnershipTypes = db.OwnershipType;
const { request } = require("express");
const { Validator } = require("node-input-validator");
const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const {
  performWalletTransaction,
  deductExpireAmount,
} = require("../../helper/helpers");
const { fn, col, Op } = require("sequelize");
const { async } = require("@firebase/util");
const { aws } = require("../../helper/aws");
const { Gift, Scheme, sequelize } = require("../../../models/");
const Language = db.Language;
const AdminNotification = db.AdminNotification;
const Notification = db.Notification;
const HelpSupport = db.HelpSupport;
const Home = db.Home;
const Vendor = db.Vendor;
const Training = db.Training;
const CatgoryWithProduct = db.CatgoryWithProduct;
const Product = db.Product;
const ProductCategory = db.ProductCategory;
const DigitalShotBooks = db.DigitalShotBook;
const Banner = db.Banner;
const QuikMenu = db.QuikMenu;
const ProductImage = db.ProductImage;
const Setting = db.Setting;
const CMS = db.CMS;
const User = db.User;
const Orders = db.Orders;
const Game = db.Game;
const Offer = db.Offer;
const UserGameWinning = db.UserGameWinning;
const UsedScheme = db.usedScheme;
let baseUrl = process.env.APP_URL;
const i18n = require("i18n");

//Home Screen
exports.homeScreen = async (req, res) => {
  try {
    const userId = req.decodedData.userId;

    const homeData = await Home.findAll({
      include: [
        {
          model: CatgoryWithProduct,
          as: "relatedData",
          attributes: ["catId"],
          include: [
            {
              model: Product,
              as: "productDetails",
              include: [
                {
                  model: ProductImage,
                  as: "productImage",
                  // attributes: [
                  // [
                  //   fn(
                  //     "CONCAT",
                  //     baseUrl,
                  //     "uploads/images/",
                  //     col("productImage")
                  //   ),
                  //   "productImage",
                  // ],
                  //],
                },
                {
                  model: Vendor,
                  as: "vendorDetails",
                  // attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
    });

    let newData = [];
    for (let i = 0; i < homeData.length; i++) {
      let news = {
        id: homeData[i].id,
        order: homeData[i].order,
        name: homeData[i].name,
        status: homeData[i].status,
        categoryId: homeData[i].categoryId,
        createdAt: homeData[i].createdAt,
        updatedAt: homeData[i].updatedAt,
      };
      let product = [];
      for (let j = 0; j < homeData[i].relatedData.length; j++) {
        if (j <= 4 && homeData[i].relatedData[j].productDetails !== null) {
          product.push(homeData[i].relatedData[j].productDetails);
        }
      }

      // homeData[i].dataValues.relatedData = product;
      if (homeData[i].dataValues.id == 4) {
        let banner = await Banner.findAll({
          where: { bannerStatus: 1 },
          limit: 5,
          order: [["id", "desc"]],
        });
        banner.forEach((item) => {
          if (item.bannerImage) {
            // item.bannerImage = baseUrl + "uploads/images/" + item.bannerImage;
            item.bannerImage = item.bannerImage;
          }
        });
        news = Object.assign(news, {
          relatedData: banner,
        });
        // homeData[i].dataValues.relatedData = banner;
      } else if (homeData[i].dataValues.id == 5) {
        let quikMenu = await QuikMenu.findAll({ where: { status: 1 } });
        quikMenu.forEach((item) => {
          if (item.image) {
            item.image = baseUrl + "uploads/images/homeIcons/" + item.image;
            // item.image =  item.image;
          }
        });
        news = Object.assign(news, {
          relatedData: quikMenu,
        });
        // console.log(quikMenu)
        // homeData[i].dataValues.relatedData = quikMenu;
      } else if (homeData[i].dataValues.id == 6) {
        let dataNew = [
          {
            id: 1,
            referAndEarn: "referAndEarn",
          },
        ];
        news = Object.assign(news, {
          relatedData: dataNew,
        });
        // homeData[i].dataValues.relatedData = data;
      } else if (homeData[i].dataValues.id == 7) {
        let data = [
          {
            id: 1,
            spin: "spin",
          },
        ];
        news = Object.assign(news, {
          relatedData: data,
        });
        // homeData[i].dataValues.relatedData = data;
      }

      // console.log("homeData[i].dataValues.relatedData ",homeData[i].dataValues.relatedData )
      else if (homeData[i].dataValues.id === 8) {
        const scheme = await Scheme.findAll({
          where: { isSpin: 1 },
          include: [
            {
              model: Product,
              as: "productDetails",
              include: [
                {
                  model: ProductImage,
                  as: "productImage",
                  attributes: [
                    "productImage",
                    // [
                    //   fn(
                    //     "CONCAT",
                    //     baseUrl,
                    //     "uploads/images/",
                    //     col("productImage")
                    //   ),
                    //   "productImage",
                    // ],
                  ],
                },
              ],
            },
            {
              model: Gift,
              as: "giftDetails",
              attributes: [
                "id",
                "giftName",
                "giftUnit",
                "giftImage",
                // [
                //   fn("CONCAT", baseUrl, "uploads/images/", col("giftImage")),
                //   "giftImage",
                // ],
              ],
            },
          ],
          order: [["id", "DESC"]],
        });

        const currentDate = new Date();

        const winningOffers = await UserGameWinning.findAll({
          where: {
            userId: userId,
            schemeId: {
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

          const schemeData = await Scheme.findOne({
            where: {
              id: data.schemeId,
            },
            include: [
              {
                model: Product,
                as: "productDetails",
                include: [
                  {
                    model: ProductImage,
                    as: "productImage",
                    // attributes: [
                    //   [
                    //     fn(
                    //       "CONCAT",
                    //       baseUrl,
                    //       "uploads/images/",
                    //       col("productImage")
                    //     ),
                    //     "productImage",
                    //   ],
                    //],
                  },
                ],
              },
              {
                model: Gift,
                as: "giftDetails",
                attributes: [
                  "id",
                  "giftName",
                  "giftUnit",
                  "giftImage",
                  // [
                  //   fn("CONCAT", baseUrl, "uploads/images/", col("giftImage")),
                  //   "giftImage",
                  // ],
                ],
              },
            ],
          });
          const usedScheme = await UsedScheme.findOne({
            where: { userId: userId, schemeId: data.schemeId },
          });

          if (!usedScheme) {
            spinOffers.push(schemeData);
          }
        }

        // Merge the arrays
        const mergedArray = [...scheme, ...spinOffers].filter(
          (item) => item !== null
        );

        news = Object.assign(news, {
          relatedData: mergedArray,
        });
        // homeData[i].dataValues.relatedData = data;
      } else {
        news = Object.assign(news, {
          relatedData: product,
        });
      }
      newData.push(news);
    }

    return success(res, "homeFetchedSuccess", newData);
  } catch (error) {
    console.log(error);
    return serverError(res, "internalServerError");
  }
};

exports.categoryList = async (req, res) => {
  try {
    const request = req.query;
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const search = request.search;

    let parms = {};
    if (search) {
      parms = Object.assign(parms, {
        [Op.or]: [
          {
            categoryName: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      });
    }
    const offset = (page - 1) * pageSize;

    const catList = await ProductCategory.findAndCountAll({
      where: { status: 1 },
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    return success(res, "categoryList", catList);
  } catch (error) {
    console.log(error);
    return serverError(res, "internalServerError");
  }
};
//owership types list
exports.ownershipTypeList = async (req, res) => {
  try {
    // Get the language from the request headers
    const lang = req.headers["accept-language"];

    // Set the language for i18n
    i18n.setLocale(lang);

    // Log the language for debugging
    console.log("Language:", lang);
    let ownershipTypeList;

    if (lang === "ass") {
      ownershipTypeList = await OwnershipTypes.findAll({
        attributes: [["ass", "types"]],
      });
    } else if (lang === "hi") {
      ownershipTypeList = await OwnershipTypes.findAll({
        attributes: [["hi", "types"]],
      });
    } else if (lang === "types") {
      ownershipTypeList = await OwnershipTypes.findAll({
        attributes: ["types"],
      });
    }

    return success(res, "ownershipTypeList", ownershipTypeList);
  } catch (error) {
    return serverError(res, "internalServerError");
  }
};

//languages list
exports.languageList = async (req, res) => {
  try {
    const languageList = await Language.findAll();

    return success(res, "successLangList", languageList);
  } catch (error) {
    console.error("Error fetching language list:", error);
    return serverError(res, "internalServerError");
  }
};

//Help & Support
exports.helpsupport = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      name: "required",
      phone: "required",
      bussinessName: "required",
      reason: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let request = req.body;
    let reqData = {
      userId: req.decodedData.userId,
      name: request.name,
      email: request.email,
      phone: request.phone,
      bussinessName: request.bussinessName,
      description: request.description,
      reason: request.reason,
    };

    let saveData = await HelpSupport.create(reqData);
    return success(res, "querySubmittedSuccess", saveData);
  } catch (error) {
    console.log(error);
    return serverError(res, "internalServerError");
  }
};

//Help & Support on Order section
exports.orderHelpsupport = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      name: "required",
      phone: "required",
      bussinessName: "required",
      description: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let request = req.body;
    let reqData = {
      userId: req.decodedData.userId,
      name: request.name,
      email: request.email,
      phone: request.phone,
      bussinessName: request.bussinessName,
      description: request.description,
      type: 2,
      orderId: request.orderId,
    };
    if (req.files && req.files.image) {
      let imageFileName = await aws(req.files.image, "help");
      reqData = Object.assign(reqData, {
        image: imageFileName.Location,
      });
    }
    let order = await Orders.findOne({ where: { orderNo: request.orderId } });

    if (order) {
      // If the order is found, update it
      await order.update({ helpQuery: 1 });
    } else {
      // Handle the case where the order is not found
      console.error("Order not found.");
      // You might want to send an appropriate response or throw an error.
    }
    let saveData = await HelpSupport.create(reqData);
    return success(res, "querySubmittedSuccess", saveData);
  } catch (error) {
    console.log(error);
    return serverError(res, "internalServerError");
  }
};

//Notifications list
exports.notificationList = async (req, res) => {
  try {
    const request = req.query;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const offset = (page - 1) * pageSize;
    const userId = req.decodedData.userId;
    const notificationList = await Notification.findAll({
      where: { userId: userId },
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    console.log(notificationList);
    const newData = {
      count: await Notification.count({ where: { userId: userId } }),
      notificationList: notificationList,
    };
    return success(res, "listFetched", newData);
  } catch (error) {
    console.log({ error });
    return serverError(res, "internalServerError");
  }
};

//Onboarding amount
exports.onBoardingBonus = async (req, res) => {
  const data = await Setting.findOne({ where: { status: 1, id: 2 } });
  if (data) {
    return success(res, "onboardingBns", data);
  } else {
    return failed(res, "Onboarding bonus status disabled.", data);
  }
};

exports.cashBack = async (req, res) => {
  const data = await Setting.findOne({ where: { status: 1, id: 3 } });
  if (data) {
    return success(res, "CashBack", data);
  } else {
    return failed(res, "CashBack status disabled.", data);
  }
};

exports.referAndEarn = async (req, res) => {
  const data = await Setting.findOne({ where: { status: 1, id: 1 } });
  if (data) {
    return success(res, "Refer and earn point.", data);
  } else {
    return failed(res, "Refer and earn point status disabled.", data);
  }
};
//upload shotbook image
exports.digitalShotbook = async (req, res) => {
  try {
    const validate = new Validator(req.files, {
      shopBookimage: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }

    const userId = req.decodedData.userId;

    let reqData = {
      userId: userId,
    };

    if (req.files && req.files.shopBookimage) {
      const shopBookimageFileName = await aws(
        req.files.shopBookimage,
        "shotbookImage"
      );
      // Merge the properties instead of overwriting
      reqData = {
        ...reqData,
        shopBookimage: shopBookimageFileName.Location,
      };
    }

    const insertedShotBook = await DigitalShotBooks.create(reqData);
    return success(res, "shotBookInsertSuccess", insertedShotBook);
  } catch (error) {
    console.error(error);
    return serverError(res, "internalServerError");
  }
};

//List digital shot book
exports.digitalShotbookList = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.limit ? req.query.limit : process.env.PAGE_LIMIT;
    const offset = (page - 1) * pageSize;
    const userId = req.decodedData.userId;
    const status = req.query.status ? req.query.status : "";
    const whereClause = {
      userId: userId,
    };

    if (status) {
      whereClause[Op.or] = [{ status: status }];
    }
    const digitalShotBook = await DigitalShotBooks.findAll({
      where: whereClause,
      attributes: [
        "id",
        "userId",
        "status",
        "shopBookimage",
        // [
        //   fn("CONCAT", baseUrl, "uploads/images/", col("shopBookimage")),
        //   "shopBookimage",
        // ],
        "createdAt",
        "updatedAt",
        "cartJson",
      ],
      order: [["id", "desc"]],
      limit: parseInt(pageSize),
      offset: offset,
    });
    const newData = {
      count: await DigitalShotBooks.count({
        where: whereClause,
      }),
      data: digitalShotBook,
    };
    return success(res, "dataFetched", newData);
  } catch (error) {
    return serverError(res, "internalServerError");
  }
};

//CMS
exports.privacyPolicy = async (req, res) => {
  const privacyPolicy = await CMS.findOne({ where: { id: 1 } });
  return success(res, "dataFetched", privacyPolicy);
};

//Term and condition
exports.termCondition = async (req, res) => {
  const termCondition = await CMS.findOne({ where: { id: 2 } });
  return success(res, "dataFetched", termCondition);
};

//About
exports.aboutUs = async (req, res) => {
  const aboutUs = await CMS.findOne({ where: { id: 3 } });
  return success(res, "dataFetched", aboutUs);
};

//Training list
exports.trainingList = async (req, res) => {
  try {
    const request = req.query;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const offset = (page - 1) * pageSize;
    const list = await Training.findAll({
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    const newData = {
      count: await Training.count(),
      list: list,
    };
    return success(res, "dataFetched", newData);
  } catch (error) {
    return serverError(res, "internalServerError");
  }
};

//Notification status
exports.notificationStatus = async (req, res) => {
  try {
    const userId = req.decodedData.userId;

    const findData = await User.findByPk(userId);

    if (!findData) {
      return failed(res, "dataNotFound");
    }

    findData.isNotification = findData.isNotification === 2 ? 1 : 2;
    await findData.save();

    return success(res, "statusUpdated", findData);
  } catch (error) {
    console.log({ error });
    return serverError(res, "internalServerError");
  }
};
//Spin the wheel
exports.spinWheel = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      sliceId: "required",
    });
    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }
    const userId = req.decodedData.userId;
    const sliceData = await Game.findByPk(req.body.sliceId);
    let newExpiredDate;

    if (req.body.sliceId == 1 || req.body.sliceId == 3) {
      newExpiredDate = new Date();
      newExpiredDate.setDate(newExpiredDate.getDate() + 30);
      console.log(newExpiredDate);
    } else {
      newExpiredDate = null;
    }

    const reqData = {
      userId: userId,
      sliceId: req.body.sliceId,
      sliceName: sliceData.name,
      offerId: sliceData.couponCode,
      prize: sliceData.prize,
      schemeId: sliceData.schemeId,
      endDate: newExpiredDate,
    };
    if (sliceData.prize != 0) {
      let currentDate = new Date();
      let nextMonthDate = new Date(currentDate);

      // Set the date to the same day of the next month
      nextMonthDate.setMonth(currentDate.getMonth() + 1);
      let reason = "Spin the Wheel";
      const newTransaction = await performWalletTransaction(
        userId,
        sliceData.prize,
        1,
        "Spin the wheel",
        nextMonthDate,
        reason
      );

      //schedule expire date
      await deductExpireAmount(nextMonthDate);
    }
    await UserGameWinning.create(reqData);
    return success(res, "Congratulations, you've won!.");
  } catch (error) {
    console.log({ error });
    return serverError(res, "internalServerError");
  }
};

//when user spin the wheel
exports.spinTime = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString();

    const latestUserSpinDate = await UserGameWinning.findOne({
      where: {
        userId: userId,
        createdAt: {
          [Op.gte]: new Date(currentDate.toISOString().split("T")[0]), // Compare dates without time
        },
      },
      order: [["createdAt", "desc"]],
    });

    return success(res, "Latest spin data", latestUserSpinDate);
  } catch (error) {
    console.log({ error });
    return serverError(res, "internalServerError");
  }
};

//Wining Scheme list
exports.userWinningList = async (req, res) => {
  try {
    const userId = req.decodedData.userId;
    const latestUserSpinDate = await UserGameWinning.findAll({
      where: {
        userId: userId,
      },
      include: [
        { model: Scheme, as: "schemeDetails" },
        {
          model: Offer,
          as: "offerDetails",
          // attributes: ["couponCode", "endDate"],
        },
      ],
      order: [["id", "desc"]],
    });

    return success(res, "Latest spin data", latestUserSpinDate);
  } catch (error) {
    console.log({ error });
    return serverError(res, "internalServerError");
  }
};
