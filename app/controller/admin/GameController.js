const db = require("../../../models");
const Game = db.Game;
const UserGameWinning = db.UserGameWinning;
const Offer = db.Offer;
const Scheme = db.Scheme;
const User = db.User;
const { success, serverError, failed } = require("../../helper/response");
const i18n = require("i18n");
//listing, update prize, update percentage
exports.slicesList = async (req, res) => {
  try {
    const slices = await Game.findAll({
      include: [
        { model: Scheme, as: "schemeDetails" },
        {
          model: Offer,
          as: "offerDetails",
        },
      ],
    });

    return success(res, "Data listed succesfully.", slices);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};
exports.manageSwing = async (req, res) => {
  try {
    const slices = req.body.data;
    console.log("+++++++++", slices);
    let totalPercentage = 0;

    for (let i = 0; i < slices.length; i++) {
      const data = slices[i];

      const checkData = await Game.findOne({ where: { id: data.id } });
      if (!checkData) {
        return failed(res, `${data.id} is not exist.`);
      }

      // Ensure the winningProbability doesn't exceed 100
      if (totalPercentage + data.winningProbability > 100) {
        return failed(res, `Total winning probability exceeds 100%.`);
      }

      totalPercentage += data.winningProbability;

      const reqData = {
        prize: data.prize,
        couponCode: data.couponCode,
        schemeId: data.schemeId,
        winningProbability: data.winningProbability,
        // colorCode: data.colorCode,
      };

      await checkData.update(reqData);
    }

    // After the loop, you can also check if the totalPercentage is exactly 100
    // if (totalPercentage !== 100) {
    //   return failed(res, `Total winning probability is not equal to 100%.`);
    // }
    return success(res, "Slices updated.", req.body.data);
  } catch (error) {
    console.error(error);

    return serverError(res, "internal server error.");
  }
};
exports.wiiningList = async (req, res) => {
  try {
    let request = req.query;
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

    const offset = (page - 1) * pageSize;
    const latestUserSpinDate = await UserGameWinning.findAll({
      include: [
        { model: Scheme, as: "schemeDetails" },
        {
          model: Offer,
          as: "offerDetails",
        },
        {
          model: User,
          as: "retailerDetails",
        },
      ],
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    const reqData = {
      count: await UserGameWinning.count(),
      data: latestUserSpinDate,
    };
    return success(res, "Data fetched successfully", reqData);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error.");
  }
};
