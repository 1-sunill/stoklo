const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const { base64Encode, base64Decode } = require("../../helper/helpers");
const mail = require("../../helper/mail");

const {
  Module,
  AdminModuleAccess,
  Accesses,
  Admin,
} = require("../../../models");
const bcrypt = require("bcryptjs");
const { Validator } = require("node-input-validator");
const { Amp } = require("aws-sdk");
const { Op } = require("sequelize");

module.exports = {
  moduleList: async (req, res) => {
    try {
      const moduleList = await Module.findAll();
      return success(res, "Data fetched successfully.", moduleList);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  accessList: async (req, res) => {
    try {
      const accessList = await Accesses.findAll();
      return success(res, "Data fetched successfully.", accessList);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  craeteSubadmin: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        name: "required",
        email: "required",
        password: "required",
        mobileNo: "required",
        role: "required",
        permissions: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { name, email, password, mobileNo, role, permissions } = req.body;
      const suadminCheck = await Admin.findOne({
        where: {
          [Op.or]: [{ email: email }],
        },
      });
      if (suadminCheck) {
        return failed(res, "Subadmin already exist.");
      }
          let salt = await bcrypt.genSalt(8);
          let newPassword = await bcrypt.hash(password, salt);
      const reqData = {
        name,
        email,
        password: newPassword,
        mobile: mobileNo,
        role,
      };

      let admin = await Admin.create(reqData);
      if (admin) {
        const url = process.env.ADMIN_BASE_URL;
        var mailData = {
          to: email,
          subject: "Subadmin Created!",
          text: url,
          html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Registration Email</title>
            </head>
            <body>
              <p>Hi ${name},</p>
            
              <p>Welcome to Stoklo admin panel. Please click on the link below to reach the admin panel:</p>
              <p>Click Here :</p> <p><a href="${url}"> Admin Panel Link</a></p>
            
              <p>You may use the following credentials to log in:</p>
              <p><strong>User Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            
              <p>Thanks & Regards<br>Stoklo Admin</p>
            </body>
          </html>`,
        };

        mail(mailData);
      }
      const permissionData = [];

      for (const permission of permissions) {
        const { moduleKey, accessKey } = permission;

        for (const access of accessKey) {
          permissionData.push({
            adminId: admin.id,
            moduleId: moduleKey,
            accessId: access,
          });
        }
      }

      if (permissionData.length > 0) {
        await AdminModuleAccess.bulkCreate(permissionData);
      }
      return success(res, "Subadmin create successfully.");
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
  updateSubadmin: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { id, name, email, password, mobileNo, role, permissions } =
        req.body;
      let subadmin = await Admin.findByPk(id);

      if (!subadmin) {
        return notFound(res, "Subadmin not found.");
      }
      const subadminCheck = await Admin.findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [{ email: email }],
            },
            {
              id: {
                [Op.not]: id,
              },
            },
          ],
        },
      });

      if (subadminCheck) {
        return failed(res, "Subadmin already exist.");
      }
      // Update subadmin details
      subadmin.name = name;
      subadmin.email = email;
      subadmin.mobile = mobileNo;
      subadmin.role = role;

      // if (password) {
      //   // Hash and update password only if provided
      //   const salt = await bcrypt.genSalt(8);
      //   const newPassword = await bcrypt.hash(password, salt);
      //   subadmin.password = newPassword;
      // }

      await subadmin.save();

      // Update permissions
      const permissionData = [];

      for (const permission of permissions) {
        const { moduleKey, accessKey } = permission;

        for (const access of accessKey) {
          permissionData.push({
            adminId: subadmin.id,
            moduleId: moduleKey,
            accessId: access,
          });
        }
      }

      // Remove existing permissions for the subadmin
      await AdminModuleAccess.destroy({ where: { adminId: subadmin.id } });

      // Create new permissions
      if (permissionData.length > 0) {
        await AdminModuleAccess.bulkCreate(permissionData);
      }

      return success(res, "Subadmin updated successfully.");
    } catch (error) {
      console.error("Error updating subadmin:", error);
      return serverError(res, "Internal server error.");
    }
  },
  subadminDetail: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let subadminDetail = await Admin.findOne({
        where: { id: req.query.id },
        include: [
          {
            model: AdminModuleAccess,
            as: "subadminDetail",
          },
        ],
      });
      return success(res, "Data fetched successfully.", subadminDetail);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
  subAdminList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      const list = await Admin.findAll({
        where: { admin: 0 },
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const newData = {
        count: await Admin.count({}),
        data: list,
      };
      return success(res, "Data listed successfully", newData);
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
  updateStatus: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const subAdmin = await Admin.findByPk(req.body.id);

      if (!subAdmin) {
        return failed(res, "Sub admin not found.");
      }

      subAdmin.status = subAdmin.status === 0 ? 1 : 0;
      await subAdmin.save();
      return success(res, "Status updated successfully.", subAdmin);
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
};
