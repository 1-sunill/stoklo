var request = require("request");
const schedule = require("node-schedule");
const db = require("../../models");

const User = db.User;
//New user signup send after 5 min
exports.newUser = async (receiverId, scheduledDate) => {
  try {
    console.log(scheduledDate);
    // Define the job using node-schedule
    const job = schedule.scheduleJob(scheduledDate, async () => {
      try {
        // Fetch user information from the database
        const userDetails = await User.findOne({
          where: {
            id: receiverId,
          },
        });
        var options = {
          method: "POST",
          url: "https://api.interakt.ai/v1/public/message/",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic T0lieF9JWjJsbUEzTHY3bFgzOUtTS3lCX3htTlBYR0pBYVlMNXIwczdhSTo=",
          },
          body: JSON.stringify({
            countryCode: "+91",
            phoneNumber: userDetails.mobileNumber,
            type: "Template",
            template: {
              name: "registered_with_stoklo",
              languageCode: "en",
            },
          }),
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
        });
        console.log("Notification sent successfully.");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });

    // return job.name;
  } catch (error) {
    console.log(error);
  }
};
//create new order
exports.orderPlaced = async (userDetail, orderId, totalAmount) => {
  try {
    totalAmount = `INR ${totalAmount}`;
    var options = {
      method: "POST",
      url: "https://api.interakt.ai/v1/public/message/",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic T0lieF9JWjJsbUEzTHY3bFgzOUtTS3lCX3htTlBYR0pBYVlMNXIwczdhSTo=",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: userDetail.mobileNumber,
        type: "Template",
        template: {
          name: "order_placed_cod_shopify_with_image",
          languageCode: "en",
          bodyValues: [userDetail.retailerName, orderId, totalAmount],
          headerValues: [
            "https://interaktstorage.blob.core.windows.net/mediastoragecontainer/91e5634a-33b0-44b4-a075-884778f02feb/message_template_sample/tcITOHfOz6vy.png?se=2026-08-13T11%3A53%3A58Z&sp=rt&sv=2019-12-12&sr=b&sig=PDn3cPLmV%2BYu3D7Wd10JYmPLQeyGyytl013wAtmbL6g%3D",
          ],
          buttonValues: {
            1: ["https://www.google.com/"],
          },
        },
      }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
  } catch (error) {
    console.error("Error sending Message:", error.message);
    throw new Error("Failed to send Message");
  }
};
//order shipped
exports.orderShipped = async (userDetail, order) => {
  try {
    var options = {
      method: "POST",
      url: "https://api.interakt.ai/v1/public/message/",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic T0lieF9JWjJsbUEzTHY3bFgzOUtTS3lCX3htTlBYR0pBYVlMNXIwczdhSTo=",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: userDetail.mobileNumber,
        type: "Template",
        template: {
          name: "order_shipped_shopify",
          languageCode: "en",
          bodyValues: [
            userDetail.retailerName,
            order.orderNo,
            order.totalAmount,
          ],
          headerValues: [
            "https://interaktstorage.blob.core.windows.net/mediastoragecontainer/91e5634a-33b0-44b4-a075-884778f02feb/message_template_sample/tcITOHfOz6vy.png?se=2026-08-13T11%3A53%3A58Z&sp=rt&sv=2019-12-12&sr=b&sig=PDn3cPLmV%2BYu3D7Wd10JYmPLQeyGyytl013wAtmbL6g%3D",
          ],
          buttonValues: {
            1: ["https://www.google.com/"],
          },
        },
      }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
  } catch (error) {
    console.error("Error sending Message:", error.message);
    throw new Error("Failed to send Message");
  }
};
//order delivered
exports.orderDelivered = async (userDetail, order) => {
  try {
    var options = {
      method: "POST",
      url: "https://api.interakt.ai/v1/public/message/",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic T0lieF9JWjJsbUEzTHY3bFgzOUtTS3lCX3htTlBYR0pBYVlMNXIwczdhSTo=",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: userDetail.mobileNumber,
        type: "Template",
        template: {
          name: "order_delivered_without_feedback",
          languageCode: "en",
          bodyValues: [
            userDetail.retailerName,
            order.orderNo,
            order.totalAmount,
          ],
          headerValues: [
            "https://interaktstorage.blob.core.windows.net/mediastoragecontainer/91e5634a-33b0-44b4-a075-884778f02feb/message_template_sample/tcITOHfOz6vy.png?se=2026-08-13T11%3A53%3A58Z&sp=rt&sv=2019-12-12&sr=b&sig=PDn3cPLmV%2BYu3D7Wd10JYmPLQeyGyytl013wAtmbL6g%3D",
          ],
          buttonValues: {
            1: ["https://www.google.com/"],
          },
        },
      }),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
    });
  } catch (error) {
    console.error("Error sending Message:", error.message);
    throw new Error("Failed to send Message");
  }
};

//After add in cart but still not order (send after one hour)
exports.whatsAppscheduleNotification = async (receiverId, scheduledDate) => {
  try {
    console.log(scheduledDate);
    // Define the job using node-schedule
    const job = schedule.scheduleJob(scheduledDate, async () => {
      try {
        // Fetch user information from the database
        const userDetails = await User.findOne({
          where: {
            id: receiverId,
          },
        });
        var options = {
          method: "POST",
          url: "https://api.interakt.ai/v1/public/message/",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic T0lieF9JWjJsbUEzTHY3bFgzOUtTS3lCX3htTlBYR0pBYVlMNXIwczdhSTo=",
          },
          body: JSON.stringify({
            countryCode: "+91",
            phoneNumber: userDetails.mobileNumber,
            type: "Template",
            template: {
              name: "abandoned_cart_1st_reminder",
              languageCode: "en",
            },
          }),
        };
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log(response.body);
        });
        console.log("Notification sent successfully.");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });
    console.log("Job ID:", job.name);
    return job.name;
  } catch (error) {
    console.log(error);
  }
};

exports.cancelledScheduling = async (jobId) => {
  try {
    // Cancel all scheduled jobs with the specified jobId
    schedule.cancelJob(jobId);
    console.log(
      "All scheduled jobs with jobId:",
      jobId,
      "cancelled successfully"
    );
  } catch (error) {
    console.error("Error cancelling scheduled jobs:", error);
  }
};
