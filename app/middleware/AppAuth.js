const jwt = require("jsonwebtoken");
const response = require("../helper/response");
const User = require("../../models/").User;

/*********************** Check user auth token  **************************/
module.exports = async function (req, res, next) {
  try {
    const token =
      (req.headers.authorization
        ? req.headers.authorization.split(" ")[1]
        : "") ||
      (req.body && req.body.access_token) ||
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"];

    if (!token) return response.failed(res, "Access denied, no token found");

    let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    let _id = decoded.userId;
    const user = await User.findByPk(_id);
    if (user == null) {
      return response.inActiveUser(res, "Account deleted.");
    }
    if (user.status === 0) {
      return response.inActiveUser(
        res,
        "Your number is inactive, please contact us."
      );
    }
   
    req.decodedData = decoded;
    next();
  } catch (error) {
    console.log(error);
    return response.failed(res, error);
  }
};
