const axios = require("axios");
const crypto = require("crypto");
const { response } = require("express");
const { serverError, success, failed } = require("../../helper/response");
const { v4 } = require("uuid");
const { PaymentTransaction, User } = require("../../../models");
let baseUrl = process.env.APP_URL;

module.exports = {
  newPayment: async (req, res) => {
    try {
      const { name, number, amount } = req.body;
      const userId = req.decodedData.userId;
      // Check if the user profile is completed and approved
      const isUserProfileCompleted = await User.findByPk(userId);
      if (isUserProfileCompleted.isProfileCompleted !== 2) {
        return failed(res, "profileNotCompleted");
        // return { success: false, message: "Your profile is not completed." };
      }

      if (isUserProfileCompleted.isApproved !== 1) {
        return failed(res, "profileCompleteButNotApproe");

        // return {
        //   success: false,
        //   message: "Your profile is completed but not yet approved.",
        // };
      }
      let marchentTransectionId = v4();
      console.log({ marchentTransectionId });
      const data = {
        merchantId: "M1EMRUPS2HFB",
        merchantTransactionId: marchentTransectionId,
        merchantUserId: "M1EMRUPS2HFB",
        name: name,
        amount: parseFloat(amount) * 100,
        redirectUrl: baseUrl + "api/payment/status",
        redirectMode: "POST",
        mobileNumber: number,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };
      const payload = JSON.stringify(data);
      const payloadMain = Buffer.from(payload).toString("base64");
      const key = process.env.SALT_KEY;
      const keyIndex = 2; // key index 2
      const string = payloadMain + "/pg/v1/pay" + key;
      const sha256 = crypto.createHash("sha256").update(string).digest("hex");
      const checksum = sha256 + "###" + keyIndex;
      const URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"; //Production
      // const URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"; //UAT Testing

      const options = {
        method: "POST",
        url: URL,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        data: {
          request: payloadMain,
        },
      };
      axios
        .request(options)
        .then(async function (response) {
          //   return res.redirect(
          //     response.data.data.instrumentResponse.redirectInfo.url
          //   );
          const reqData = {
            userId,
            merchantTransactionId: marchentTransectionId,
          };
          await PaymentTransaction.create(reqData);
          return res
            .status(200)
            .send(response.data.data.instrumentResponse.redirectInfo.url);
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
  status: async (req, res) => {
    try {
      const merchantTransactionId = res.req.body.transactionId;
      const merchantId = res.req.body.merchantId;
      const key = process.env.SALT_KEY;
      const keyIndex = 2;
      const string =
        `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
      const sha256 = crypto.createHash("sha256").update(string).digest("hex");
      const checksum = sha256 + "###" + keyIndex;
      console.log({ checksum });
      console.log({ merchantId });
      console.log({ merchantTransactionId });
      console.log({ sha256 });
      const URL = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`; //Peoduction
      // const URL = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;//UAT testing
      const options = {
        method: "GET",
        url: URL,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": merchantId,
        },
      };
      console.log({ options });

      //Check payment status
      axios
        .request(options)
        .then(async (response) => {
          console.log("response.data", response.data);
          console.log("response.data.success", response.data.success);
          console.log("response.data.success.data", response.data.success.data);
          if (response.data.success == true) {
            const checkData = await PaymentTransaction.findOne({
              where: {
                merchantTransactionId: response.data.data.merchantTransactionId,
              },
            });
            console.log({ checkData });
            if (checkData) {
              const reqData = {
                transactionId: response.data.data.transactionId,
                state:
                  response.data.data.state == "COMPLETED"
                    ? "Success"
                    : "Failed",
                amount: response.data.data.amount,
                paymentInstrument: JSON.stringify(
                  response.data.data.paymentInstrument
                ),
              };
              await checkData.update(reqData);
            }
          }

          if (response.data.data.state == "COMPLETED") {
            res.redirect(
              baseUrl +
                "api/payment/success?transactionId=" +
                res.req.body.transactionId
            );
          } else {
            res.redirect(
              baseUrl +
                "api/payment/failed?transactionId=" +
                res.req.body.transactionId
            );
          }

          //   return redirectUrl()
          //   return res.status(200).send({
          //     success: true,
          //     message: "Payment Success",
          //     response: response.data,
          //   });
        })
        .catch((error) => {
          console.log("Payment failed", error);
          return res
            .status(400)
            .send({ success: false, message: "Payment Failure" });
        });
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error");
    }
  },
  failed: async (req, res) => {
    console.log("ssssssssss");
    return res.status(400).send({ success: false, message: "Payment Failed" });
  },
  success: async (req, res) => {
    console.log("ffffffffff");
    return res.status(200).send({ success: true, message: "Payment Success" });
  },
};
