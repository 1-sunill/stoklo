const {
  serverError,
  failed,
  success,
  validateFail,
} = require("../../helper/response");
const {
  calculateDeliveryCharges,
  createOrderHelper,
  sendFCMtoken,
  addAmountWallet,
} = require("../../helper/helpers");
const db = require("../../../models/");
const { Validator } = require("node-input-validator");
const { fn, col, Op } = require("sequelize");
const {
  Cart,
  Product,
  OrderProducts,
  Orders,
  User,
  ProductImage,
  sequelize,
  Bundles,
  BundleProductsImage,
  BundleProducts,
  usedScheme,
  Vendor,
  Scheme,
  Gift,
  Setting,
} = db;
const { aws } = require("../../../app/helper/aws");
const { now } = require("moment");
const { orderPlaced } = require("../../helper/whatsapp");

let baseUrl = process.env.APP_URL;

module.exports = {
  createOrder: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const request = req.body;
      const userId = req.decodedData.userId;
      const transactionId = req.body.txnId ? req.body.txnId : "";
      const coupon = request.coupon || "";
      const couponCodeAmount = parseFloat(request.couponCodeAmount) || 0;
      const gstAmount = parseFloat(request.gstAmount) || 0;
      const totalAmount = parseFloat(request.totalAmount) || 0;
      const walletAmount = parseFloat(request.walletAmount) || 0;
      const deliveryCharge = parseFloat(request.deliveryCharge) || 0;

      //this productIds and schemeIds for Scheme on the order
      const productIds = request.productId || [];
      const schemeIds = request.schemeId || [];
      //  let deliveryCharge = await calculateDeliveryCharges(totalAmount);

      const result = await createOrderHelper(
        userId,
        coupon,
        couponCodeAmount,
        gstAmount,
        totalAmount,
        deliveryCharge,
        walletAmount,
        transactionId
      );
      const userDetail = await User.findByPk(userId);
      for (let i = 0; i < Math.max(schemeIds.length); i++) {
        const productId = productIds[i] || null;
        const schemeId = schemeIds[i] || null;
        // Update product stock
        if (schemeId || productId) {
          // console.log({schemeId});

          const schemeProduct = await Scheme.findByPk(parseInt(schemeId));
          // console.log("ttttttttttttttttttt",schemeProduct);

          console.log(schemeProduct);
          if (schemeProduct) {
            if (schemeProduct.giftProductId) {
              const updatePrd = await Product.findOne({
                where: { id: schemeProduct.giftProductId },
              });

              if (updatePrd.noOfStock != 0) {
                const currentSchemeEarn = (await userDetail.schemeEarn) || 0;
                const updatedSchemeEarn =
                  parseFloat(currentSchemeEarn) + parseFloat(updatePrd.mrp);

                await userDetail.update({ schemeEarn: updatedSchemeEarn });
                await updatePrd.update({ noOfStock: updatePrd.noOfStock - 1 });
              } else {
                await updatePrd.update({ noOfStock: 0 });
              }
            } else {
              const gift = await Gift.findOne({
                where: { id: schemeProduct.giftId },
              });
              const currentSchemeEarn = userDetail.schemeEarn || 0;
              const updatedSchemeEarn =
                parseFloat(currentSchemeEarn) + parseFloat(gift.giftPrice);
              await userDetail.update({ schemeEarn: updatedSchemeEarn });
            }
            let orderId = result.orderData.dataValues.id;
            await usedScheme.create({ userId, productId, schemeId, orderId });
          }
        }
      }
      if (result.success) {
        let title = `Order id - ${result.orderData.orderNo}`;
        let message = "Order placed successfully.";
        sendFCMtoken(
          userId,
          title,
          message,
          1 //NotificationType 0=>admin,1=>order,2=>wallet
        );

        // const productIdData = Array.isArray(productIds)
        //   ? productIds
        //   : JSON.parse(productIds);
        // let bundleStock = [];

        // if (Array.isArray(productIdData)) {
        //   for (let i = 0; i < productIdData.length; i++) {
        //     const data = productIdData[i];
        //     const bundles = await BundleProducts.findAll({
        //       where: { productId: data },
        //     });

        //     for (let j = 0; j < bundles.length; j++) {
        //       const element = bundles[j];
        //       const prod = await Product.findByPk(element.dataValues.productId);
        //       let noOfStock;
        //       let bundleIdData;

        //       if (element.dataValues.qty == 1) {
        //         noOfStock = prod.dataValues.noOfStock;
        //         bundleIdData = element.dataValues.bundleId;
        //       } else {
        //         bundleIdData = element.dataValues.bundleId;

        //         noOfStock = Math.round(
        //           Number(prod.dataValues.noOfStock) / element.dataValues.qty
        //         );
        //       }

        //       if (isFinite(noOfStock)) {
        //         // Check if noOfStock is a finite number
        //         bundleStock.push({ noOfStock, bundleIdData });
        //       }
        //     }
        //   }

        //   const uniqueBundleIds = Array.from(
        //     new Set(bundleStock.map((item) => item.bundleIdData))
        //   );
        //   // console.log(uniqueBundleIds);
        //   for (const bundleIdData of uniqueBundleIds) {
        //     const minNoOfStock = Math.min(
        //       ...bundleStock
        //         .filter((item) => item.bundleIdData === bundleIdData)
        //         .map((item) => item.noOfStock)
        //     );

        //     await Bundles.update(
        //       { noOfStock: minNoOfStock },
        //       { where: { id: bundleIdData } }
        //     );
        //   }
        // }
        //whatsApp notification
        await orderPlaced(userDetail, result.orderData.orderNo, totalAmount);
        //Cashback
        const setting = await Setting.findByPk(3);
        if (totalAmount >= parseFloat(setting.minCartValue)) {
          await addAmountWallet(userId, totalAmount);
        }
        return success(res, result.message, result.orderData);
      } else {
        return failed(res, result.message);
      }
    } catch (error) {
      console.error(error);
      await t.rollback();
      return serverError(res, "internalServerError");
    }
  },

  //Cancel order
  cancelOrder: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        orderId: "required",
        cancelReason: "required",
        cancelDescription: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
  
      const { orderId, cancelReason, cancelDescription } = req.body;
  
      // Check if the order exists
      const checkOrder = await Orders.findOne({ where: { id: orderId } });
      if (!checkOrder) {
        return failed(res, "orderNotCorrect");
      }
  
      // Find all products in the order
      const orderProducts = await OrderProducts.findAll({
        where: { orderId: orderId },
      });
  
      // Update the stock quantity for each product
      for (const element of orderProducts) {
        const product = await Product.findOne({ where: { id: element.productId } });
        const bundle = await Bundles.findOne({ where: { id: element.bundleId } });
  
        if (product) {
          await product.update({
            noOfStock: product.noOfStock + element.quantity,
          });
        } else if (bundle) {
          const bundleProducts = await BundleProducts.findAll({
            where: { bundleId: bundle.id },
          });
  
          if (!Array.isArray(bundleProducts)) {
            return failed(res, "Invalid bundle products data.");
          }
  
          let bundleStock = [];
          let count = 0;
  
          for (const bundleProduct of bundleProducts) {
            const productCheck = await Product.findOne({ where: { id: bundleProduct.productId } });
  
            // if (!productCheck) {
            //   return failed(res, `${bundleProduct.productId} does not exist.`);
            // }
  
            // if (bundleProduct.qty > productCheck.noOfStock) {
            //   return failed(
            //     res,
            //     `${productCheck.productName} has only ${productCheck.noOfStock} quantity.`
            //   );
            // }
  
            let noOfStock;
            if (bundleProduct.qty === 1) {
              noOfStock = productCheck.noOfStock;
            } else {
              noOfStock = Math.round(productCheck.noOfStock / bundleProduct.qty);
            }
  
            bundleStock.push({ noOfStock, bundleId: bundle.id });
            count++;
          }
  
          const minNoOfStock = Math.min(...bundleStock.map(item => item.noOfStock));
          
          // Update product count and stock in Bundle model
          await Bundles.update(
            { productCount: count, noOfStock: minNoOfStock },
            { where: { id: bundle.id } }
          );
        }
      }
  
      // Prepare data for updating the order
      let reqData = {
        cancelReason,
        cancelDescription,
        rejectedDate: new Date(), // Use the current date
        status: 4,
      };
  
      // Handle file upload if present
      if (req.files && req.files.cancelImage) {
        const cancelImageFileName = await aws(req.files.cancelImage, "cancelProduct");
        reqData = {
          ...reqData,
          cancelImage: cancelImageFileName.Location,
        };
      }
  
      // Update the order with cancellation data
      const updatedData = await checkOrder.update(reqData);
      return success(res, "orderCancelled", updatedData);
  
    } catch (error) {
      console.error(error);
      return serverError(res, "internalServerError");
    }
  }, 
  //Order history
  orderHistory: async (req, res) => {
    try {
      const request = req.query;
      const userId = req.decodedData.userId;
      // 0=>pending,1=>processinga as accepted,2=>shipped,3=>delivered,4=>cancelled
      const status = request.status ? request.status : "";
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let parms = {};

      if (status) {
        parms = Object.assign(parms, {
          status: status,
        });
      }

      const orders = await Orders.findAll({
        where: { ...parms, userId: userId },
        include: [
          {
            model: OrderProducts,
            as: "orderDetail",
            // attributes: ["productId", "quantity"],
          },
        ],
        attributes: [
          "id",
          "orderNo",
          "trackingId",
          "status",
          "totalAmount",
          "noOfItem",
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });
      let data = {
        count: await Orders.count({
          where: parms,
          include: [
            {
              model: OrderProducts,
              as: "orderDetail",
              attributes: ["quantity"],
            },
          ],
        }),
        rows: orders,
      };
      return success(res, "orderHistory", data);
    } catch (error) {
      console.error(error);
      return serverError(res, "internalServerError");
    }
  },

  //Order Details
  orderDetail: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let orderId = req.query.id;
      const order = await Orders.findByPk(orderId, {
        include: [
          {
            model: OrderProducts,
            as: "orderDetail",
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
                    //     sequelize.fn(
                    //       "CONCAT",
                    //       baseUrl,
                    //       "uploads/images/",
                    //       sequelize.col(
                    //         "orderDetail.productDetails.productImage.productImage"
                    //       )
                    //     ),
                    //     "productImage",
                    //   ],
                    // ],
                  },
                ],
              },
              {
                model: Bundles,
                as: "bundleDetails",
                include: [
                  {
                    model: BundleProductsImage,
                    as: "bundleImages",
                    // attributes: [
                    //   [
                    //     sequelize.fn(
                    //       "CONCAT",
                    //       baseUrl,
                    //       "uploads/images/",
                    //       sequelize.col(
                    //         "orderDetail.bundleDetails.bundleImages.bundleImage"
                    //       )
                    //     ),
                    //     "bundleImage",
                    //   ],
                    // ],
                  },
                  {
                    model: BundleProducts,
                    as: "bundleProducts",
                    include: [
                      {
                        model: Product,
                        as: "productDetails",
                        include: [
                          {
                            model: ProductImage,
                            as: "productImageForScheme",
                            // attributes: [
                            //   [
                            //     sequelize.fn(
                            //       "CONCAT",
                            //       baseUrl,
                            //       "uploads/images/",
                            //       sequelize.col(
                            //         "orderDetail.bundleDetails.bundleProducts.productDetails.productImageForScheme.productImage"
                            //       )
                            //     ),
                            //     "productImage",
                            //   ],
                            // ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!order) {
        return failed(res, "orderNotExist");
      }

      return success(res, "orderDetailFetched", order);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
};
