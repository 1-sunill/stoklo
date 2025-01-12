const { serverError, success, validateFail } = require("../../helper/response");
const db = require("../../../models");
const { User, AdminNotification } = db;
const { Op } = require("sequelize");
const moment = require("moment");
const {
  createAndSendNotificationFromAdmin,
  scheduleNotification,
} = require("../../helper/helpers");
const { Validator } = require("node-input-validator");
module.exports = {
  usersList: async (req, res) => {
    try {
      //Get only which users which has fcmToken
      const users = await User.findAll({
        where: {
          fcmToken: {
            [Op.not]: null,
          },
        },
        // attributes: ["id","retailerName"],
      });

      return success(res, "Users list fetched successfully.", users);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
  //Send push notification from admin
  sendNotification: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        type: "required",
        title: "required",
        message: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const { type, title, message } = req.body;
      let users;
      const reqData = {
        title,
        description: message,
        type,
      };

      if (req.body.scheduleDate) {
        let scheduleDate = req.body.scheduleDate ? req.body.scheduleDate : "";
        let scheduleTime = req.body.scheduleTime ? req.body.scheduleTime : "";
        let scheduleDateTime = moment(
          `${scheduleDate} ${scheduleTime}`,
          "YYYY-MM-DD HH:mm"
        );
        let scheduleDateTimeToSave = moment(
          `${scheduleDate} ${scheduleTime}`,
          "YYYY-MM-DD HH:mm"
        );

        let adjustedDateTime = scheduleDateTime.subtract(5, 'hours').subtract(30, 'minutes');
        reqData.scheduleDate = scheduleDateTimeToSave.format();
        if (type == 1) {
          users = await User.findAll({
            where: {
              fcmToken: {
                [Op.not]: null,
              },
            },
            attributes: ["id"],
          });

          await AdminNotification.create(reqData);
          for (let i = 0; i < users.length; i++) {
            const userId = users[i].id || users[i];
            scheduleNotification(
              userId,
              title,
              message,
              // notificationDromAdmin.id,
              type, //AdminNotificationType 1=>For All,2=>Selective
              0, //NotificationType 0=>admin,1=>order,2=>wallet
              adjustedDateTime.toDate()
            );
          }
        } else {
          users = req.body.usersId || [];
          for (let i = 0; i < users.length; i++) {
            const userId = users[i] || users[i];
            scheduleNotification(
              userId,
              title,
              message,
              // notificationDromAdmin.id,
              type, //AdminNotificationType 1=>For All,2=>Selective
              0, //NotificationType 0=>admin,1=>order,2=>wallet
              adjustedDateTime.toDate()

            );
          }
          // console.log(users); return 1;
          // reqData.users = JSON.stringify(users);
          await AdminNotification.create(reqData);
        }
      } else {
        const notificationDromAdmin = await AdminNotification.create(reqData);

        if (type == 1) {
          users = await User.findAll({
            where: {
              fcmToken: {
                [Op.not]: null,
              },
            },
            attributes: ["id"],
          });
        } else {
           users = Array.isArray(req.body.usersId) ? req.body.usersId : [req.body.usersId || undefined];
          // users = req.body.usersId || [];
        }
        console.log({users});
        for (let i = 0; i < users.length; i++) {
          const userId = users[i].id || users[i];
          await createAndSendNotificationFromAdmin(
            userId,
            title,
            message,
            notificationDromAdmin.id,
            0, //AdminNotificationType 0=>For All,1=>Selective
            0 //NotificationType 0=>admin,1=>order,2=>wallet
          );
        }
      }

      return success(res, "Notification send successfully.");
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error");
    }
  },
  //notifications list
  notificationList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;

      const offset = (page - 1) * pageSize;

      const notificationList = await AdminNotification.findAll({
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      const resData = {
        notificationList: notificationList,
        count: await AdminNotification.count(),
      };
      return success(res, "Notification list fetched successfully.", resData);
    } catch (error) {
      return serverError(res, "Internal server error");
    }
  },
};
