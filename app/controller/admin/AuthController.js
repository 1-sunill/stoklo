const {
  failed,
  success,
  serverError,
  validateFail,
} = require("../../helper/response");
const Admin = require("../../../models/").Admin;
const AdminModuleAccess = require("../../../models/").AdminModuleAccess;
const Module = require("../../../models/").Module;
const { Validator } = require("node-input-validator");
const jwt = require("../../../utils/jwt.util");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const mail = require("../../helper/mail");
const { base64Encode, base64Decode } = require("../../helper/helpers");
const { json } = require("sequelize");

//Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      email: "required",
      password: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      validateFail(res, validate);
      return;
    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({
      where: { email: email },
    });
    console.log(admin);
    if (!admin) {
      return failed(res, "Admin not found.");
    }
    if (admin.status == 0) {
      return failed(res, "Account is blocked by admin.");
    }
    if (admin) {
      // Check if admin exists
      const isPasswordValid = await bcrypt.compareSync(
        password,
        admin.password
      );
      if (isPasswordValid) {
        const token = await jwt.createToken({ data: admin.id });
        console.log(admin.id);
        const permission = await AdminModuleAccess.findAll({
          where: { adminId: admin.id },
          attributes: ["id", "moduleId", "accessId"],
          include: [
            {
              model: Module,
              as: "moduleDetails",
              attributes: ["id", "name", "access"],
            },
          ],
          // group: ["moduleId"],
        });
        const data = {
          admin,
          access_token: token,
          permission,
        };
        success(res, "Admin login successfully.", data);
      } else {
        failed(res, "Password is not valid.");
      }
    } else {
      failed(res, "Email is not valid.");
    }
  } catch (error) {
    console.log({ error });
    serverError(res, "Internal Server error");
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      email: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }

    const { email } = req.body;
    const admin = await Admin.findOne({
      where: { email },
    });
    if (admin) {
      const url =
        process.env.ADMIN_RESET_PASSWORD +
        base64Encode(admin.email.toLowerCase());
      var mailData = {
        to: email,
        subject: "Change Password Request",
        text: url,
        html: `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
          </head>
          <body>
            <p>Hi ${admin.name},</p>
          
            <p>To reset your password, please click on the link below:</p>
            <p><a href="${url}">Reset Password Link</a></p>
          
            <p>Thanks & Regards<br>Stoklo Admin</p>
          </body>
        </html>`,
      };

      mail(mailData);

      success(res, "Password reset email sent.", mailData);
    } else {
      failed(res, "Email doesn't exist.");
    }
  } catch (error) {
    console.error(error);
    serverError(res, "Internal server error.");
  }
};

//Change Password
exports.changePassword = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      key: "required",
      newPassword: "required|same:confirmPassword",
    });
    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }

    const { newPassword } = req.body;
    const decodedKey = base64Decode(req.body.key);

    const checkEmailExist = await Admin.findOne({
      where: { email: decodedKey },
    });

    if (!checkEmailExist) {
      return failed(res, "Email not found.");
    }
    let salt = await bcrypt.genSalt(8);
    let password = await bcrypt.hash(newPassword, salt);
    arrayData = {
      password: password,
    };
    const url =
      process.env.ADMIN_RESET_PASSWORD +
      base64Encode(checkEmailExist.email.toLowerCase());
    var mailData = {
      to: checkEmailExist.email,
      subject: "Password has been changed ",
      text: url,
      html: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed Confirmation</title>
        </head>
        <body>
          <p>Hi ${checkEmailExist.name},</p>
        
          <p>Your password has successfully been changed.</p>
          <p>If you didn't perform this action, please click on "Forgot Password" in the link below to change your password again:</p>
          <p><a href="${url}">Forgot Password Link</a></p>
        
          <p>Thanks & Regards<br>Stoklo Admin</p>
        </body>
      </html>`,
    };

    mail(mailData);
    await checkEmailExist.update(arrayData);

    return success(res, "Password changed successfully.");
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal Server Error.");
  }
};
