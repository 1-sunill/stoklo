const { Validator } = require("node-input-validator");
const {
  serverError,
  validateFail,
  success,
  failed,
} = require("../../helper/response");
const db = require("../../../models/");
const { where, fn, col } = require("sequelize");
const Cart = db.Cart;
const Product = db.Product;
const ProductImage = db.ProductImage;
const Offer = db.Offer;
const Orders = db.Orders;
const Vendor = db.Vendor;
const User = db.User;
const Bundles = db.Bundles;
const BundleProductsImage = db.BundleProductsImage;
const BundleProducts = db.BundleProducts;
const Scheme = db.Scheme;
const Gift = db.Gift;
const Setting = db.Setting;
const {
  calculateGST,
  calculateDeliveryCharges,
  addAmountWallet,
} = require("../../helper/helpers");
const moment = require("moment");
const {
  whatsAppscheduleNotification,
  cancelledScheduling,
} = require("../../helper/whatsapp");

let baseUrl = process.env.APP_URL;

module.exports = {
  addToCart: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        product_id: "required",
        quantity: "required|integer",
        type: "required|integer",
      });
      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }
      const userId = req.decodedData.userId;
      // Get the current time
      let currentTime = new Date();
      let scheduleDateTime = moment(currentTime, "YYYY-MM-DD HH:mm");
      let timeAfterOneHour = moment(currentTime).add(1, "hour");

      console.log("Current Time:", scheduleDateTime.format("YYYY-MM-DD HH:mm"));
      console.log(
        "Time After One hour:",
        timeAfterOneHour.format("YYYY-MM-DD HH:mm")
      );
      let scheduleId;
      // console.log(req.body.quantity);
      if (parseInt(req.body.quantity) !== 0) {
        console.log(232434);
        scheduleId = await whatsAppscheduleNotification(
          userId,
          timeAfterOneHour.format("YYYY-MM-DD HH:mm")
        );
      }

      // Fetch all cart records belonging to the specified userId
      let carts = await Cart.findAll({ where: { userId: userId } });

      // Iterate over each cart record and update the scheduleId
      for (let i = 0; i < carts.length; i++) {
        const cart = carts[i];

        // Cancel any previous scheduled job associated with the current cart record
        await cancelledScheduling(cart["scheduleId"]);

        // Update the scheduleId for the current cart record
        await cart.update({ schesduleId: scheduleId });
      }

      console.log(
        "ScheduleId updated for all cart records belonging to userId:",
        userId
      );

      const { product_id, quantity, type } = req.body;
      if (type == 1) {
        let checkProduct = await Product.findOne({
          where: { id: product_id },
        });

        if (!checkProduct) {
          return failed(res, "productNotExist");
        }
        if (checkProduct.noOfStock == 0) {
          return failed(res, "productOutOfStock");
        }
        if (checkProduct.noOfStock < quantity) {
          return failed(res, "insufficientQuantity");
        }
        if (checkProduct.status == 0) {
          return failed(res, "prodNotAvail");
        }
        let checkCart = await Cart.findOne({
          where: { userId: userId, productId: product_id, type: 1 },
        });

        if (checkCart) {
          if (quantity == 0) {
            // Delete from the cart if the request quantity is 0
            await checkCart.destroy();
            return success(res, "itemRemoveCart");
          } else {
            await checkCart.update({
              quantity: parseInt(quantity),
            });

            return success(res, "cartUpdate", checkCart);
          }
        } else {
          const parsedQuantity = parseInt(quantity);
          const productId = parseInt(product_id);
          if (parsedQuantity < 1) {
            return failed(res, "quantityAtleast1");
          }
          let reqData = {
            userId: userId,
            quantity: parsedQuantity,
            productId: productId,
            scheduleId: scheduleId,
          };

          const newCartItem = await Cart.create(reqData);

          return success(res, "itemAddedToCart", newCartItem);
        }
      } else {
        //product_id is bundle id
        let checkBundleProduct = await Bundles.findOne({
          where: { id: product_id },
        });

        if (!checkBundleProduct) {
          return failed(res, "bundleNotFound");
        }
        if (checkBundleProduct.noOfStock == 0) {
          return failed(res, "bundleOutOfStock");
        }
        if (checkBundleProduct.noOfStock < quantity) {
          return failed(res, "insufficientQuantity");
        }
        if (checkBundleProduct.status == 0) {
          return failed(res, "bundleNotAvail");
        }
        let checkCart = await Cart.findOne({
          where: { userId: userId, bundleId: product_id, type: 2 },
        });

        if (checkCart) {
          if (quantity == 0) {
            // Delete from the cart if the request quantity is 0
            await checkCart.destroy();
            return success(res, "itemRemoveCart");
          } else {
            // console.log({quantity});
            await checkCart.update({
              quantity: parseInt(quantity),
            });
            return success(res, "cartUpdate", checkCart);
          }
        } else {
          const parsedQuantity = parseInt(quantity);
          const productId = product_id;
          if (parsedQuantity < 1) {
            return failed(res, "quantityAtleast1");
          }
          let reqData = {
            userId: userId,
            quantity: parsedQuantity,
            productId: 0,
            bundleId: productId,
            type: 2,
          };

          const newCartItem = await Cart.create(reqData);

          return success(res, "itemAddedToCart", newCartItem);
        }
      }
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
  repeatCart: async (req, res) => {
    try {
      const productWithQty = req.body.data;

      const userId = req.decodedData.userId;

      //Check user exist
      let checkUser = await User.findOne({
        where: { id: userId },
      });
      if (!checkUser) {
        return failed(res, "User not found.");
      }

      let checkCart = await Cart.findAll({
        where: { userId: userId },
      });
      // console.log(checkCart); return 1;
      // Check if any cart records were found
      if (checkCart && checkCart.length > 0) {
        // Delete all cart records for the specified user
        await Cart.destroy({
          where: { userId: userId },
        });
      }
      for (const product of productWithQty) {
        if (product.type == 1) {
          let checkProduct = await Product.findOne({
            where: { id: product.productId },
          });

          if (!checkProduct) {
            return failed(res, "productNotExist");
          }
          if (checkProduct.noOfStock == 0) {
            return failed(
              res,
              `Product ${checkProduct.productName} is out of stock.`
            );
          }
          if (checkProduct.noOfStock < product.qty) {
            return failed(
              res,
              `${checkProduct.productName} has Insufficient quantity.`
            );
          }
          let reqData = {
            productId: product.productId,
            quantity: product.qty,
            userId: userId,
            type: product.type,
          };
          await Cart.create(reqData);
        } else {
          let checkProduct = await Bundles.findOne({
            where: { id: product.productId },
          });

          if (!checkProduct) {
            return failed(res, "bundleNotFound");
          }
          if (checkProduct.noOfStock == 0) {
            return failed(
              res,
              `Bundle ${checkProduct.bundleName} is out of stock.`
            );
          }
          if (checkProduct.noOfStock < product.qty) {
            return failed(
              res,
              `${checkProduct.bundleName} has Insufficient quantity.`
            );
          }
          let reqData = {
            bundleId: product.productId,
            quantity: product.qty,
            userId: userId,
            type: product.type,
          };
          await Cart.create(reqData);
        }
      }
      // Get the current time
      let currentTime = new Date();
      let timeAfterOneHour = moment(currentTime).add(1, "minutes");
      whatsAppscheduleNotification(
        userId,
        timeAfterOneHour.format("YYYY-MM-DD HH:mm")
      );
      console.log(123);
      return success(res, "itemAddedinCart");
    } catch (error) {
      console.log({ error });
      return serverError(res, "internalServerError");
    }
  },
  cartList: async (req, res) => {
    try {
      let request = req.query;
      const userId = req.decodedData.userId;
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;

      const gst = request.gst ? request.gst : "";
      const couponCode = request.couponCode ? request.couponCode : "";

      let cartList = await Cart.findAll({
        where: { userId: userId, status: 1 },
        include: [
          {
            model: Product,
            as: "productDetails",
            // attributes: [
            //   "productName",
            //   "compositionName",
            //   "length",
            //   "width",
            //   "height",
            //   "margin",
            //   "mrp",
            //   "netPrice",
            // ],

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
                // ],
              },
              {
                model: Vendor,
                as: "vendorDetails",
                // attributes: ["name"],
              },
              {
                model: Scheme,
                as: "schemeDetails",
                include: [
                  {
                    model: Gift,
                    as: "giftDetails",
                    attributes: [
                      "id",
                      "giftName",
                      "giftUnit",
                      "giftImage",
                      // [
                      //   fn(
                      //     "CONCAT",
                      //     baseUrl,
                      //     "uploads/images/",
                      //     col("giftImage")
                      //   ),
                      //   "giftImage",
                      // ],
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: Bundles,
            as: "bundleDetails",
            include: [
              {
                model: BundleProducts,
                as: "bundleProducts",
                include: [
                  {
                    model: Product,
                    as: "productDetails",
                    // attributes: [
                    //   "id",
                    //   "productZohoId",
                    //   "productName",
                    //   "vendorId",
                    //   "compositionName",
                    //   "netPrice",
                    // ],
                  },
                ],
              },
              {
                model: BundleProductsImage,
                as: "bundleImages",
                // attributes: [
                //   [
                //     fn(
                //       "CONCAT",
                //       baseUrl,
                //       "uploads/images/",
                //       col("bundleImage")
                //     ),
                //     "bundleImage",
                //   ],
                // ],
              },
            ],
          },
        ],
        // limit: parseInt(pageSize),
        // offset: offset,
        order: [["id", "desc"]],
      });
      let cartData = [];

      let procuctTotalPrice = 0;
      let bundleTotalPrice = 0;
      for (let index = 0; index < cartList.length; index++) {
        const currentItem = cartList[index];
        // console.log(currentItem.productDetails.schemeDetails)
        let productDetailsNew = null;
        if (
          currentItem.productDetails &&
          currentItem.productDetails.schemeDetails &&
          currentItem.productDetails.schemeDetails.giftProductId
        ) {
          productDetailsNew = await Product.findOne({
            where: {
              id: currentItem.productDetails.schemeDetails.giftProductId
                ? currentItem.productDetails.schemeDetails.giftProductId
                : 0,
            },
            attributes: ["id", "productName"],
            include: [
              // {
              //   model: Scheme,
              //   as: "schemeDetails",
              // },
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
                // ],
              },
            ],
          });
          // return success(res, "dsf", productDetailsNew.dataValues );

          currentItem.productDetails.schemeDetails.dataValues.productDetails =
            productDetailsNew.dataValues;
        }

        let itemPrice;
        if (currentItem.productId !== 0 && currentItem.productId != null) {
          const product = await Product.findOne({
            where: { id: currentItem.productId },
            attributes: ["noOfStock"],
          });
          if (product == null) {
            return failed(res, "productNotExist");
          }

          itemPrice =
            currentItem.quantity * (currentItem.productDetails.netPrice || 0);
          procuctTotalPrice = procuctTotalPrice + itemPrice;
          const newData = {
            id: currentItem.id,
            productId: currentItem.productId,
            userId: currentItem.userId,
            quantity: currentItem.quantity,
            createdAt: currentItem.createdAt,
            updatedAt: currentItem.updatedAt,
            productDetails: currentItem.productDetails,
            itemPrice: itemPrice,
            image:
              currentItem.productDetails.productImage?.[0]?.productImage ||
              null,
          };

          if (product && product.noOfStock < currentItem.quantity) {
            newData.availableQuantity = parseInt(product.noOfStock);
          }

          cartData.push(newData);
        } else {
          const bund = await Bundles.findOne({
            where: { id: currentItem.bundleId },
            include: [
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
                        // ],
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
          const pp = bund.bundleProducts;
          let finalData = [];
          for (let i = 0; i < pp.length; i++) {
            const ff = pp[i];
            if (ff.productDetails != null) {
              // bundleProductImage = ff.productDetails.productImage;
              finalData.push(ff);
            }
          }
          // finalData = currentItem.bundleDetails
          // return success(res, "sdsdsd", bund);

          // console.log(bund.bundleProducts); return 1;
          itemPrice =
            currentItem.quantity *
            (currentItem.bundleDetails.discountPrice || 0);
          bundleTotalPrice = bundleTotalPrice + itemPrice;
          const newData = {
            id: currentItem.id,
            productId: currentItem.bundleId,
            userId: currentItem.userId,
            quantity: currentItem.quantity,
            createdAt: currentItem.createdAt,
            updatedAt: currentItem.updatedAt,
            productDetails: bund,
            itemPrice: itemPrice,
          };

          cartData.push(newData);
        }
      }
      // console.log({bundleTotalPrice}, {procuctTotalPrice})
      // Calculate total amount of all cart items

      const sumTotalAmount =
        parseFloat(bundleTotalPrice) + parseFloat(procuctTotalPrice);

      let cartDataCount = await Cart.count({
        where: { userId: userId },
      });
      if (cartDataCount > 0) {
        let calculatedOfferAmount = "";
        // Function to calculate coupon discount based on coupon type and values
        const calculateCouponDiscount = (
          totalItemPrice,
          couponInPercent,
          couponAmount
        ) => {
          if (couponInPercent) {
            return (totalItemPrice * couponInPercent) / 100;
          } else if (couponAmount) {
            // return Math.min(totalItemPrice, couponAmount);
            return couponAmount;
          }
          return 0;
        };

        // Check if a coupon code is provided
        if (couponCode !== "") {
          // Find the coupon details in the Offer table
          checkCouponIsUsed = await Offer.findOne({
            where: { couponCode: couponCode },
          });

          // Check if the coupon is found in the Offer table
          if (checkCouponIsUsed) {
            const currentDate = new Date();
            const startDate = new Date(checkCouponIsUsed.startDate);
            const endDate = new Date(checkCouponIsUsed.endDate);

            // Check if the coupon is valid based on the current date
            if (currentDate >= startDate && currentDate <= endDate) {
              const minAmount = parseFloat(checkCouponIsUsed.minAmount);
              const maxAmount = parseFloat(checkCouponIsUsed.maxAmount);
              const totalItemPrice = sumTotalAmount;

              // Check if the totalItemPrice is within the valid range for the coupon
              // we check on the minimum amount should be grater or equal to total price
              if (totalItemPrice >= minAmount) {
                // console.log(1233);
                // Apply the coupon discount
                calculatedOfferAmount = calculateCouponDiscount(
                  totalItemPrice,
                  checkCouponIsUsed.couponInPercent,
                  checkCouponIsUsed.couponAmount
                );
              } else {
                // Order amount is not valid for this coupon
                return failed(res, "orderAmtNotValidForCoupon");
              }
            } else {
              // Coupon is invalid or expired
              return failed(res, "couponInvalidOrexpire");
            }
          } else {
            // Coupon is invalid or not found
            return failed(res, "couponNotFound");
          }
        }
        // End of the offer code
        let deliveryCharge = await calculateDeliveryCharges(sumTotalAmount);
        let wallet = await User.findByPk(userId);

        let walletAmount = wallet ? wallet.walletAmount : 0;
        let gst = await calculateGST(
          sumTotalAmount,
          calculatedOfferAmount,
          deliveryCharge
        );

        // Calculate total amount
        let totalAmount =
          sumTotalAmount + // Total item price
          gst + // GST
          (parseFloat(calculatedOfferAmount)
            ? parseFloat(calculatedOfferAmount)
            : 0) + // Offer amount
          deliveryCharge; // Delivery amount
        let settingWallet = await Setting.findByPk(6);

        const calculateFromSetting =
          (sumTotalAmount * settingWallet.percentage) / 100;
        const afterPercentage = calculateFromSetting;
        // console.log({ sumTotalAmount });

        // console.log({ afterPercentage });
        let walletCalculatedDiscount = Math.min(
          afterPercentage,
          settingWallet.amount
        );
        // console.log({ walletDiscount });

        // console.log(settingWallet.percentage);
        // Calculate wallet discount based on the wallet amount
        // let walletDiscount = Math.min(walletAmount, sumTotalAmount);//old code till 14/feb/24
        let walletDiscount = Math.min(walletAmount, walletCalculatedDiscount);

        let paidAmount = totalAmount - walletDiscount;
        // //Cashback
        // const setting = await Setting.findByPk(3);
        // let cashback = 0;
        // if (totalAmount >= parseFloat(setting.minCartValue)) {
        //   await addAmountWallet(userId, totalAmount);
        //   cashback = parseFloat(setting.amount);
        // } else {
        //   cashback = 0;
        // }
        // const showCashback = cashback > 0 ? true : false;

        //Brief all amounts
        let calculatedAmount = {
          // showCashback,
          totalItemPrice: sumTotalAmount,
          gst: gst,
          walletDiscount: walletDiscount,
          offerAmount: parseFloat(calculatedOfferAmount)
            ? parseFloat(calculatedOfferAmount)
            : 0,
          deliveryAmount: deliveryCharge,
          totalAmount: paidAmount,
        };
        let newData = {
          count: await Cart.count({
            where: { userId: userId, status: 1 },
          }),
          cartData: cartData,
          calculatedAmount: calculatedAmount ? calculatedAmount : 0,
        };
        return success(res, "cartFetched", newData);
      } else {
        return failed(res, "cartEmpty");
      }
      // return success(res, "Cart data fetched successfully.", cartList);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
  applyCoupon: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        couponId: "required|numeric",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const userId = req.decodedData.userId;
      let useer = await User.findByPk(userId);

      let coupon = await Offer.findOne({
        where: { id: req.body.couponId },
      });

      if (!coupon) {
        return failed(res, "couponNotExist");
      }
      let order = await Orders.findOne({
        where: { couponCode: coupon.couponCode, userId: userId },
      });
      if (order) {
        return failed(res, "couponAlreadyUser");
      }
      let cartData = await Cart.findAll({
        where: { userId: userId },
        include: [
          {
            model: Product,
            as: "productDetails",
          },
          {
            model: Bundles,
            as: "bundleDetails",
          },
        ],
      });

      // return 1;
      // Calculate total amount of all cart items
      // const sumTotalAmount = cartData.reduce(
      //   (accumulator, cartProduct) =>
      //     accumulator +
      //     cartProduct.quantity * cartProduct.productDetails.netPrice,
      //   0
      // );
      let procuctTotalPrice = 0;
      let bundleTotalPrice = 0;
      for (let index = 0; index < cartData.length; index++) {
        const currentItem = cartData[index];
        let itemPrice;
        // console.log(currentItem.dataValues);
        if (currentItem.productId !== 0 && currentItem.productId != null) {
          const product = await Product.findOne({
            where: { id: currentItem.productId },
            attributes: ["noOfStock"],
          });
          itemPrice =
            currentItem.quantity * (currentItem.productDetails.netPrice || 0);
          procuctTotalPrice = procuctTotalPrice + itemPrice;
        } else {
          itemPrice =
            currentItem.quantity *
            (currentItem.bundleDetails.discountPrice || 0);
          bundleTotalPrice = bundleTotalPrice + itemPrice;
        }
      }

      const sumTotalAmount =
        parseFloat(bundleTotalPrice) + parseFloat(procuctTotalPrice);
      const remainingAmount = Math.abs(
        parseFloat(useer.walletAmount) - parseFloat(sumTotalAmount)
      );

      console.log("remainingAmount", remainingAmount);
      console.log("useer.walletAmount", useer.walletAmount);
      console.log("sumTotalAmount", sumTotalAmount);
      // if (remainingAmount <= 0)
      // {
      //   return failed(res, "amtShouldGraterZero");
      // }

      if (coupon.minAmount > sumTotalAmount) {
        const restAmount = coupon.minAmount - sumTotalAmount;
        return failed(res, `Add ${restAmount} more to apply this offer!.`);
      }
      let calculatedOfferAmount = "";
      // Function to calculate coupon discount based on coupon type and values
      const calculateCouponDiscount = (
        totalItemPrice,
        couponInPercent,
        couponAmount
      ) => {
        if (couponInPercent) {
          return (totalItemPrice * couponInPercent) / 100;
        } else if (couponAmount) {
          // return Math.min(totalItemPrice, couponAmount);
          return couponAmount;
        }
        return 0;
      };

      // Check if a coupon code is provided
      if (coupon.couponCode !== "") {
        // Find the coupon details in the Offer table
        checkCouponIsUsed = await Offer.findOne({
          where: { couponCode: coupon.couponCode },
        });

        // Check if the coupon is found in the Offer table
        if (checkCouponIsUsed) {
          const currentDate = new Date();
          const startDate = new Date(checkCouponIsUsed.startDate);
          const endDate = new Date(checkCouponIsUsed.endDate);

          // Check if the coupon is valid based on the current date
          if (currentDate >= startDate && currentDate <= endDate) {
            const minAmount = parseFloat(checkCouponIsUsed.minAmount);
            const maxAmount = parseFloat(checkCouponIsUsed.maxAmount);
            const totalItemPrice = sumTotalAmount;

            // Check if the totalItemPrice is within the valid range for the coupon
            // we check on the minimum amount should be grater or equal to total price
            if (totalItemPrice >= minAmount) {
              // console.log(1233);
              // Apply the coupon discount
              calculatedOfferAmount = calculateCouponDiscount(
                totalItemPrice,
                checkCouponIsUsed.couponInPercent,
                checkCouponIsUsed.couponAmount
              );
            } else {
              // Order amount is not valid for this coupon
              return failed(res, "orderAmtnotValidForThisCpn");
            }
          } else {
            // Coupon is invalid or expired
            return failed(res, "couponInvalidOrexpire");
          }
        } else {
          // Coupon is invalid or not found
          return failed(res, "couponNotFound");
        }
      }
      const newData = {
        couponAmount: calculatedOfferAmount,
        cartAmount: sumTotalAmount,
      };
      return success(res, "offerApplicable", newData);
      // console.log(sumTotalAmount);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
};
