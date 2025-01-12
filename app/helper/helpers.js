const crypto = require("crypto");
const { promisify } = require("util");
const http = require("https");
let axios = require("axios");
var request = require("request");
const db = require("../../models");
const { Op } = require("sequelize");
const { where, fn, col } = require("sequelize");
const firebase = require("firebase-admin");
var serviceAccount = require("../../config/stokloFcm.json");
const moment = require("moment");
const schedule = require("node-schedule");
const { Sequelize } = require("../../models");
const DeliveryCharge = db.DeliveryCharges;
const User = db.User;
const Notification = db.Notification;
const WalletTransaction = db.WalletTransaction;
const Cart = db.Cart;
const Product = db.Product;
const Orders = db.Orders;
const OrderProducts = db.OrderProducts;
const AdminNotification = db.AdminNotification;
const Bundles = db.Bundles;
const BundleProductsImage = db.BundleProductsImage;
const BundleProducts = db.BundleProducts;
const PointTransaction = db.PointTransaction;
const Setting = db.Setting;
const { format } = require("date-fns");
const { title, resourceUsage } = require("process");

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});
const generateRandomString = promisify(crypto.randomBytes);
//Generate referralcode
exports.generateRefferCode = async (retailerName) => {
  const retailerNameSubstring = retailerName.slice(0, 4).toUpperCase();
  const randomBytes = await generateRandomString(3);
  const randomString = randomBytes.toString("hex").toUpperCase();
  const referralCode = `${retailerNameSubstring}${randomString}`;
  return referralCode;
};
//Image upload
exports.fileUpload = async (file, folder = null) => {
  // Define the destination folder where you want to save the uploaded files
  const destinationFolder = "uploads/images/";

  // Create the destination folder if it doesn't exist
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  // Create a function to delete an existing file
  const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  // Function to generate a unique filename
  const generateUniqueFilename = (file) => {
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1e9);
    return `image-${timestamp}-${randomSuffix}.${fileExtension}`;
  };

  // Delete and save shopImage
  const shopImageFileName = generateUniqueFilename(shopImage);
  const shopImageFilePath = path.join(destinationFolder, shopImageFileName);

  deleteFile(shopImageFilePath); // Delete the old shop image, if it exists

  await shopImage.mv(shopImageFilePath);
};

exports.base64Encode = function (request) {
  var res = Buffer.from(request).toString("base64");
  return res;
};

exports.base64Decode = function (request) {
  var res = Buffer.from(request, "base64").toString("ascii");
  return res;
};

//Send otp using authkey.io
exports.sendOtp = async function (mobile, otp) {
  try {
    const response = await axios.get("https://api.authkey.io/request", {
      params: {
        authkey: "97363050591f50bc",
        country_code: "91",
        pe_id: "1701165296667371087",
        template_id: "1707169460131605282",
        mobile: mobile,
        sender: "STOKLO",
        sms: `OTP for Registration: ${otp} http://stoklo.com`,
      },
    });

    // Check the HTTP status code
    if (response.status === 200) {
      // console.log(response.data);
      return response.data; // You might want to return the response data or handle it as needed
    } else {
      throw new Error(`Failed to send OTP. Status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    throw new Error("Failed to send OTP");
  }
};

//calculate gst
exports.calculateGST = async function (
  totalAmount,
  offerAmount,
  deliveryAmount
) {
  // Calculate the taxable amount
  const taxableAmount = totalAmount - (offerAmount + deliveryAmount);

  // GST rate (assuming 12%)
  const gstRate = 0.12;

  // Calculate GST
  const gst = gstRate * taxableAmount;

  return gst;
};

//calculate delivery charges
exports.calculateDeliveryCharges = async function (sumTotalAmount) {
  try {
    // Find the relevant delivery charge rule based on the total amount
    const deliveryChargeRule = await DeliveryCharge.findOne({
      where: {
        minAmount: { [Op.lte]: sumTotalAmount },
        maxAmount: { [Op.gt]: sumTotalAmount },
      },
      order: [["amount", "DESC"]],
    });

    // If a matching rule is found, return the associated delivery charge
    if (deliveryChargeRule) {
      // console.log(123);
      return parseFloat(deliveryChargeRule.amount);
    }

    // If no matching rule is found, return a default delivery charge (or handle it as needed)
    return 0; // Default delivery charge when no rule matches
  } catch (error) {
    console.error(error);
    throw new Error("Error calculating delivery charges.");
  }
};

//Wallet management
exports.performWalletTransaction = async (
  userId,
  amount,
  transactionType,
  transactionSource,
  adminExpiryDate = null,
  reason = null
) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null; // Or handle the case where the user is not found
    }
    let setting;

    if (transactionSource === "Refer and earn") {
      // console.log(1);
      setting = await Setting.findByPk(1);
    } else {
      // console.log(2);
      setting = await Setting.findByPk(2);
    }
    // console.log(setting); return 1;

    // Calculate expiry date
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setDate(currentDate.getDate() + parseInt(setting.noOfDays));
    const formattedExpiryDate = format(expiryDate, "yyyy-MM-dd HH:mm:ss");
    const walletTransactions = await WalletTransaction.findAll({
      where: {
        userId: userId,
      },
      order: [["id", "DESC"]],
      limit: 1,
    });

    const beforeWalletAmount = walletTransactions.length
      ? walletTransactions[0].afterWalletAmount
      : 0;

    let afterWalletAmount;

    switch (transactionType) {
      case 1: // Credit
        afterWalletAmount = parseFloat(beforeWalletAmount) + parseFloat(amount);
        break;
      case 2: // Debit
        afterWalletAmount = parseFloat(beforeWalletAmount) - parseFloat(amount);
        break;
      case 3: // Credit
        afterWalletAmount = parseFloat(amount);
        break;
      case 4: // spent from new order
        afterWalletAmount = parseFloat(beforeWalletAmount) - parseFloat(amount);

        break;
      default:
        // Handle unknown transaction types
        throw new Error(`Unknown transactionType: ${transactionType}`);
    }
    let newTransaction;
    if (adminExpiryDate != null) {
      //When Admin Credit Amount
      newTransaction = await WalletTransaction.create({
        userId: userId,
        beforeWalletAmount,
        afterWalletAmount,
        transactionSource: transactionSource,
        transactionType: transactionType,
        amount: amount,
        expiryDate: adminExpiryDate,
      });
      await exports.deductExpireAmount(adminExpiryDate);
      await PointTransaction.create({
        userId: userId,
        transactionSource: transactionSource,
        transactionType: transactionType,
        amount: amount,
        reason: reason,
        expiryDate: adminExpiryDate,
      });
    } else {
      newTransaction = await WalletTransaction.create({
        userId: userId,
        beforeWalletAmount,
        afterWalletAmount,
        transactionSource: transactionSource,
        transactionType: transactionType,
        amount: amount,
        expiryDate: formattedExpiryDate,
      });
      await PointTransaction.create({
        userId: userId,
        transactionSource: transactionSource,
        transactionType: transactionType,
        amount: amount,
        reason: reason,
        expiryDate: formattedExpiryDate,
      });
      //schedule expire date
      await exports.deductExpireAmount(expiryDate);
    }

    await user.update({ walletAmount: afterWalletAmount });

    return newTransaction;
  } catch (error) {
    console.error(error);
    throw new Error("Error performing wallet transaction.");
  }
};

exports.performOrderWalletTransaction = async (
  userId,
  amount,
  transactionType,
  transactionSource,
  reason = null
) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null; // Or handle the case where the user is not found
    }

    const walletTransactions = await WalletTransaction.findAll({
      where: {
        userId: userId,
        orderId: null,
      },
      order: [["expiryDate", "ASC"]],
      // limit: 1,
    });
    // console.log(walletTransactions); return 1;
    let remainingAmount = amount;
    let currentDate = new Date();
    let latestTransactionAmt = null;
    let latestTransactionExpiryDate = null;
    for (let i = 0; i < walletTransactions.length; i++) {
      const transaction = walletTransactions[i];
      const transactionExpiryDate = new Date(transaction.dataValues.expiryDate);

      if (remainingAmount > 0 && transactionExpiryDate > currentDate) {
        const transactionAmount = parseFloat(transaction.dataValues.amount);

        if (remainingAmount >= transactionAmount) {
          // If remaining amount is greater than or equal to the transaction amount,
          // deduct the transaction amount and update remaining amount
          remainingAmount -= transactionAmount;
          transaction.dataValues.amount = 0; // Assuming you want to update the transaction amount to 0
        } else {
          // If remaining amount is less than the transaction amount,
          // deduct the remaining amount and update transaction amount
          transaction.dataValues.amount -= remainingAmount;
          remainingAmount = 0;
        }

        // Update the transaction in the database
        const newTransaction = await WalletTransaction.findOne({
          where: {
            id: transaction.dataValues.id,
          },
        });

        // Modify the newTransaction with the updated values
        newTransaction.amount = 0;
        newTransaction.orderId = transactionSource;
        // newTransaction.expiryDate = null;

        latestTransactionAmt = transaction.dataValues.amount;
        latestTransactionExpiryDate = transaction.dataValues.expiryDate;
        // Update the transaction in the database
        await newTransaction.save();
      }
    }
    // Create a new entry with the latest transaction information
    // if (latestTransactionAmt > 0) {
    const newData = {
      userId: userId,
      transactionSource: "Remaining Amount",
      amount: latestTransactionAmt,
      afterWalletAmount: user.walletAmount,
      expiryDate: latestTransactionExpiryDate,
    };
    await WalletTransaction.create(newData);
    // }

    // return 1;
    // Sum up the remaining amounts from all transactions
    // const totalRemainingAmount = walletTransactions.reduce(
    //   (total, transaction) => total + parseFloat(transaction.dataValues.amount),
    //   0
    // );

    // Update the walletAmount in the user table
    // await user.update({ walletAmount: totalRemainingAmount });

    const newTransaction = await PointTransaction.create({
      userId: userId,
      transactionSource: transactionSource,
      transactionType: transactionType,
      amount: amount,
      reason: reason,
    });
    return newTransaction;
  } catch (error) {
    console.error(error);
    throw new Error("Error performing wallet transaction.");
  }
};
//generate unique id
exports.generateRandomOrderId = function () {
  const randomBuffer = crypto.randomBytes(8);

  const orderId = randomBuffer.toString("hex").toUpperCase();

  return orderId;
};
//create new order
exports.createOrderHelper = async (
  userId,
  coupon,
  couponCodeAmount,
  gstAmount,
  totalAmount,
  deliveryCharge,
  walletAmnt,
  transactionId = null
) => {
  const userWallet = await User.findByPk(userId);
  const walletAmt = userWallet
    ? userWallet.walletAmount
      ? parseFloat(userWallet.walletAmount)
      : 0
    : 0;

  const totalAmountToPaid =
    parseFloat(totalAmount) + // Total item price
    parseFloat(gstAmount) + // GST
    parseFloat(couponCodeAmount) + // Coupon code amount
    parseFloat(deliveryCharge); // Delivery charge
  const walletDiscount = Math.min(walletAmnt, totalAmountToPaid);
  const orderId = exports.generateRandomOrderId();
  const userDetails = await User.findByPk(userId);

  // Check if the user profile is completed and approved
  const isUserProfileCompleted = await User.findByPk(userId);
  if (isUserProfileCompleted.isProfileCompleted !== 2) {
    return {
      success: false,
      message: "Please complete your profile to order.",
    };
  }

  if (isUserProfileCompleted.isApproved !== 1) {
    return {
      success: false,
      message: "Your profile is not yet approved, please wait.",
    };
  }

  const cartProducts = await Cart.findAll({
    where: { userId: userId },
    include: [
      { model: Product, as: "productDetails" },
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
        ],
      },
    ],
  });

  // Check if the cart is empty
  if (cartProducts.length === 0) {
    return { success: false, message: "Cart is empty. Cannot place an order." };
  }
  // console.log(cartProducts); return 1;

  // const sumTotalAmount = cartProducts.reduce(
  //   (accumulator, cartProduct) =>
  //     accumulator + cartProduct.quantity * cartProduct.productDetails.netPrice,
  //   0
  // );
  let procuctTotalPrice = 0;
  let bundleTotalPrice = 0;
  for (let index = 0; index < cartProducts.length; index++) {
    const currentItem = cartProducts[index];
    let itemPrice;
    if (cartProducts[index].type == 1) {
      // console.log(currentItem.productDetails.margin); return 1;
      itemPrice =
        currentItem.quantity * (currentItem.productDetails.netPrice || 0);
      procuctTotalPrice = procuctTotalPrice + itemPrice;

      // cartData.push(itemPrice);
    } else {
      itemPrice =
        currentItem.quantity * (currentItem.bundleDetails.discountPrice || 0);
      bundleTotalPrice = bundleTotalPrice + itemPrice;
      // cartData.push(itemPrice);
    }
  }
  const sumTotalAmount =
    parseFloat(bundleTotalPrice) + parseFloat(procuctTotalPrice);

  const walletAmount = walletAmnt;
  const deliveryAmount = deliveryCharge;
  const gst = gstAmount;
  const couponCode = coupon;
  const couponAmount = couponCodeAmount;
  const chargableAmount = gst + deliveryAmount;
  let paidAmount = totalAmountToPaid - walletDiscount;
  let transactionType;
  if(transactionId){
    transactionType = "Phone Pay";
  }else{
    transactionType = "COD";

  }
  // Create new order
  const orderData = await Orders.create({
    userId: userId,
    orderNo: orderId,
    couponCode: couponCode,
    couponAmount: couponAmount,
    walletAmount: walletAmount,
    deliveryAmount: deliveryAmount,
    gst: gst,
    itemAmount: sumTotalAmount,
    totalAmount: totalAmount,
    status: 1,
    address: userDetails.shopLocation,
    transactionId: transactionId,
    transactionType,

  });
  //Add coupon amount in earning amount
  if (couponAmount > 0) {
    const earnedAmount = userWallet.schemeEarn || 0;
    const updatedSchemeEarnAmt =
      parseFloat(earnedAmount) + parseFloat(couponAmount);
    await userWallet.update({ schemeEarn: updatedSchemeEarnAmt });
    // console.log({ updatedSchemeEarnAmt });
    // return 1;
  }
  // Check product availability and quantity
  let productIds = [];
  for (const cartProduct of cartProducts) {
    const cartProductQuantity = cartProduct.quantity;
    if (cartProduct.type == 1) {
      productIds.push(cartProduct.productId);
      const productId = cartProduct.productId;
      const product = await Product.findOne({ where: { id: productId } });

      if (!product || product.status === 0) {
        return {
          success: false,
          message: `${product.productName} is not available.`,
        };
      }
      if (!product || product.noOfStock === 0) {
        return {
          success: false,
          message: "One or more products are out of stock.",
        };
      }

      if (cartProductQuantity > product.noOfStock) {
        return {
          success: false,
          message: "Insufficient quantity for one or more products.",
        };
      }

      // Update product stock
      await Product.update(
        { noOfStock: product.noOfStock - cartProductQuantity },
        { where: { id: productId } }
      );

      // const totalItemAmount = cartProductQuantity * product.netPrice;
      await OrderProducts.create({
        orderId: orderData.id,
        orderNo: orderId,
        productId: productId,
        amount: product.netPrice,
        quantity: cartProductQuantity,
        type: 1, //Product
      });

      const userEarnedData = userWallet.schemeEarn || 0;
      const prodMargin = parseFloat(product.margin) * cartProductQuantity;
      const updatedSchemeEarn = parseFloat(userEarnedData) + prodMargin;
      await userWallet.update({ schemeEarn: updatedSchemeEarn });
      console.log("Margin amount", updatedSchemeEarn);
    } else {
      const productId = cartProduct.bundleId;
      //product reduce code start
      const product = await Bundles.findOne({ where: { id: productId } });
      //Reduce product from table
      const bundleProd = await BundleProducts.findAll({
        where: { bundleId: productId },
      });
      for (let j = 0; j < cartProductQuantity; j++) {
        //Bundle quantity count loop
        for (let i = 0; i < bundleProd.length; i++) {
          //update product quantity
          const prod = bundleProd[i];
          const productOne = await Product.findOne({
            where: { id: prod.productId },
          });
          const updatedStock = Math.max(productOne.noOfStock - prod.qty, 0);

          await Product.update(
            { noOfStock: updatedStock },
            { where: { id: prod.productId } }
          );
        }
      }
      //product reduce code end

      if (!product || product.status === 0) {
        return {
          success: false,
          message: `${product.bundleName} is not available.`,
        };
      }
      if (!product || product.noOfStock === 0) {
        return {
          success: false,
          message: "One or more products are out of stock.",
        };
      }
      // console.log(product.noOfStock)
      if (cartProductQuantity > product.noOfStock) {
        return {
          success: false,
          message: "Insufficient quantity for one or more products.",
        };
      }

      // Update product stock
      await Bundles.update(
        { noOfStock: product.noOfStock - cartProductQuantity },
        { where: { id: productId } }
      );

      // const totalItemAmount = cartProductQuantity * product.netPrice;
      await OrderProducts.create({
        orderId: orderData.id,
        orderNo: orderId,
        bundleId: productId,
        amount: product.discountPrice,
        quantity: cartProductQuantity,
        type: 2, //Bundle Product
      });
    }
  }

  // Update user wallet
  if (walletDiscount > 0) {
    userWallet.walletAmount -= walletDiscount;
    // console.log("walletDiscount", walletDiscount);
    const userEarnedDataAmount = userWallet.schemeEarn || 0;
    const updatedSchemeEarn = parseFloat(userEarnedDataAmount) + walletDiscount;
    await userWallet.update({ schemeEarn: updatedSchemeEarn });
    await userWallet.save();
  }
  // console.log(walletDiscount);
  // Insert data in wallet transaction history
  exports.performOrderWalletTransaction(
    userId,
    walletDiscount,
    2,
    `OrderId - ${orderId}`
  );
  // console.log(productIds);
  await exports.updateBundleStock(productIds);

  // Remove items from the cart
  await Cart.destroy({ where: { userId: userId } });

  return { success: true, message: "Order placed successfully.", orderData };
  // return { success: true, message: "Order placed successfully." };
};

//Access Token
exports.generateAccessToken = async (req, res) => {
  try {
    const zohoReqData = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token?refresh_token=1000.30ba31fa905fcbc7ccf29e64914b5cbb.b6535b91d7d181f115b21ccab485ae3e&client_id=1000.0FHX5OBSNYG44JM2ZS7SN5JEICB87R&client_secret=eabb0b5faa48c76fcfbd1316487a5345cdc393e6a3&redirect_uri=https://dre.zoho.in/delugeauth/callback&grant_type=refresh_token"
    );

    console.log(zohoReqData);
    return zohoReqData;
  } catch (error) {
    console.log(error);
  }
};
//Create product for zoho
exports.createZohoProduct = async (reqData) => {
  const number = parseFloat(reqData.noOfStock);
  const formattedNumber = number.toFixed(2); // This will be "22.00" as a string

  const accessToken = await exports.generateAccessToken();
  try {
    const zohoReqData = await axios.post(
      "https://www.zohoapis.in/inventory/v1/items?organization_id=60024704764",
      {
        name: reqData.productName,
        sku: reqData.sku,
        rate: reqData.netPrice,
        item_type: "inventory",
        per_tablet_net_rate: reqData.netPricePerUnit,
        mrp: reqData.mrp,
        per_tablet_mrp: reqData.mrpPerUnit,
        margin_percentage: "",
        per_tablet_margin: reqData.marginPerUnit,
        stock_on_hand: formattedNumber,
        initial_stock: formattedNumber,
        initial_stock_rate: formattedNumber,

        custom_fields: [
          {
            field_id: "1527205000000029083",
            customfield_id: "1527205000000029083",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 1,
            label: "Packaging",
            show_on_pdf: true,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_packaging",
            show_in_all_pdf: true,
            value_formatted: "1x2x3",
            search_entity: "item",
            data_type: "string",
            placeholder: "cf_packaging",
            value: reqData.dimestion,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029019",
            customfield_id: "1527205000000029019",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 2,
            label: "Per Tablet Net Rate",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_net_rate",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_net_rate",
            value: reqData.netPricePerUnit,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029027",
            customfield_id: "1527205000000029027",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 3,
            label: "MRP",
            show_on_pdf: true,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_mrp",
            show_in_all_pdf: true,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_mrp",
            value: reqData.mrp,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029055",
            customfield_id: "1527205000000029055",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 4,
            label: "Per tablet MRP",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_mrp",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_mrp",
            value: reqData.mrpPerUnit,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029063",
            customfield_id: "1527205000000029063",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 5,
            label: "Margin",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_margin",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_margin",
            value: reqData.margin,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029071",
            customfield_id: "1527205000000029071",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 6,
            label: "Per tablet Margin",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_margin",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_margin",
            value: reqData.marginPerUnit,
            is_dependent_field: false,
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken.data.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(zohoReqData);
    return zohoReqData;
  } catch (error) {
    console.log(error);
  }
};

//update product for zoho
exports.updateZohoProduct = async (reqData) => {
  const accessToken = await exports.generateAccessToken();
  console.log(accessToken.data.access_token);

  try {
    const productId = reqData.productId;
    const zohoReqData = await axios.put(
      `https://www.zohoapis.in/inventory/v1/items/${productId}?organization_id=60024704764`,
      {
        name: reqData.productName,
        sku: reqData.sku,
        rate: reqData.netPrice,
        item_type: "inventory",
        per_tablet_net_rate: reqData.netPricePerUnit,
        mrp: reqData.mrp,
        per_tablet_mrp: reqData.mrpPerUnit,
        margin_percentage: "",
        per_tablet_margin: reqData.marginPerUnit,
        custom_fields: [
          {
            field_id: "1527205000000029083",
            customfield_id: "1527205000000029083",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 1,
            label: "Packaging",
            show_on_pdf: true,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_packaging",
            show_in_all_pdf: true,
            value_formatted: "1x2x3",
            search_entity: "item",
            data_type: "string",
            placeholder: "cf_packaging",
            value: reqData.dimestion,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029019",
            customfield_id: "1527205000000029019",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 2,
            label: "Per Tablet Net Rate",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_net_rate",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_net_rate",
            value: reqData.netPricePerUnit,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029027",
            customfield_id: "1527205000000029027",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 3,
            label: "MRP",
            show_on_pdf: true,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_mrp",
            show_in_all_pdf: true,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_mrp",
            value: reqData.mrp,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029055",
            customfield_id: "1527205000000029055",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 4,
            label: "Per tablet MRP",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_mrp",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_mrp",
            value: reqData.mrpPerUnit,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029063",
            customfield_id: "1527205000000029063",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 5,
            label: "Margin",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_margin",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_margin",
            value: reqData.margin,
            is_dependent_field: false,
          },
          {
            field_id: "1527205000000029071",
            customfield_id: "1527205000000029071",
            show_in_store: false,
            show_in_portal: false,
            is_active: true,
            index: 6,
            label: "Per tablet Margin",
            show_on_pdf: false,
            edit_on_portal: false,
            edit_on_store: false,
            api_name: "cf_per_tablet_margin",
            show_in_all_pdf: false,
            value_formatted: "0.00",
            search_entity: "item",
            data_type: "decimal",
            placeholder: "cf_per_tablet_margin",
            value: reqData.marginPerUnit,
            is_dependent_field: false,
          },
        ],
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken.data.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(zohoReqData);
  } catch (error) {
    console.log(error);
  }
};

//send notification
exports.sendFCMtoken = async (
  receiverId,
  message,
  title = "StokLo",
  notificationType
) => {
  try {
    let tokens = "";
    let notificationData = {
      userId: receiverId,
      title: title,
      description: message,
      type: notificationType,
    };
    await Notification.create(notificationData);
    let userDetails = await User.findOne({
      where: {
        id: receiverId,
        isNotification: 1,
      },
    });
    // console.log("User details:", userDetails);

    if (userDetails && userDetails.dataValues.fcmToken) {
      tokens = userDetails.dataValues.fcmToken;
    } else {
      console.log("User details or FCM token not found");
      return false;
    }

    const nmessage = {
      token: tokens,
      notification: {
        title: title,
        body: message,
      },
      data: {
        link: message ? message.toString() : "",
        type: notificationType.toString(),
      },
    };

    // console.log("Sending notification:", nmessage);
    await firebase.messaging().send(nmessage);

    return true;
  } catch (error) {
    // console.log("error", error);
    // return Promise.reject(error);
  }
};

//send notification using FCM token from admin
exports.createAndSendNotificationFromAdmin = async (
  receiverId,
  message,
  title = "StokLo",
  adminId,
  adminNotificationtype,
  notificationType
) => {
  try {
    let tokens = "";
    let notificationData = {
      userId: receiverId,
      title: title,
      description: message,
      adminId: adminId,
      type: notificationType,
    };
    await Notification.create(notificationData);
    let userDetails = await User.findOne({
      where: {
        id: receiverId,
        isNotification: 1,
      },
    });
    // console.log("User details:", userDetails);
    // console.log("+++++++",receiverId);

    if (userDetails && userDetails.dataValues.fcmToken) {
      tokens = userDetails.dataValues.fcmToken;
    } else {
      // console.log(userDetails);

      console.log("User details or FCM token not found");
      return false;
    }

    const nmessage = {
      token: tokens,
      notification: {
        title: title,
        body: message,
      },
      data: {
        link: message ? message.toString() : "",
        type: notificationType.toString(),
      },
    };

    // console.log("Sending notification:", nmessage);
    await firebase.messaging().send(nmessage);

    return true;
  } catch (error) {
    console.log("error", error);
    // return Promise.reject(error);
  }
};

exports.scheduleNotification = async (
  receiverId,
  message,
  title = "StokLo",
  adminNotificationtype,
  notificationType,
  scheduledDate
) => {
  try {
    console.log("scheduledDate",scheduledDate);
    // Define the job using node-schedule
    const job = schedule.scheduleJob(scheduledDate, async () => {
      try {
        // Fetch user information from the database
        const userDetails = await User.findOne({
          where: {
            id: receiverId,
            isNotification: 1,
          },
        });
        console.log("+++++++++++", receiverId);
        if (!userDetails || !userDetails.fcmToken) {
          console.log("User details or FCM token not found");
          return false;
        }

        const tokens = userDetails.fcmToken;

        // Save data in admin notification table
        // const adminNotificationData = {
        //   userId: receiverId,
        //   title: title,
        //   description: message,
        //   scheduleDate: scheduledDate,
        //   type: adminNotificationtype,
        // };

        // const adminDetail = await AdminNotification.create(
        //   adminNotificationData
        // );

        // Save data in user notification table
        const notificationData = {
          userId: receiverId,
          description: message,
          title,
          // adminId: adminDetail.id,
          type: notificationType,
        };
        await Notification.create(notificationData);
        // Perform the action when the scheduled time is reached
        console.log("Sending scheduled notification:", notificationData);

        // Send the notification to the user
        const nmessage = {
          token: tokens,
          notification: {
            title: title,
            body: message,
          },
          data: {
            link: message ? message.toString() : "",
            type: notificationType.toString(),
          },
        };

        // Log the message before sending for debugging purposes
        console.log("Sending notification:", nmessage);

        // Assuming you have initialized Firebase with your config
        await firebase.messaging().send(nmessage);

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

exports.calculateTotalRemainingAmount = async (userId) => {
  try {
    const currentDate = new Date();

    // Find all wallet transactions for the user
    const walletTransactions = await WalletTransaction.findAll({
      where: {
        userId: userId,
        expiryDate: {
          [Op.greaterThan]: currentDate, // Filter transactions where expiryDate is greater than the current date
        },
      },
    });

    // Calculate the total remaining amount from valid transactions
    const totalRemainingAmount = walletTransactions.reduce(
      (total, transaction) =>
        total + parseFloat(transaction.dataValues.amount || 0),
      0
    );

    return totalRemainingAmount;
  } catch (error) {
    console.error(error);
    throw new Error("Error calculating total remaining amount.");
  }
};
//Deduct amount on shcedule time
exports.deductExpireAmount = async (scheduledDate) => {
  try {
    console.log("Come to jpb expiry", scheduledDate);
    // Define the job using node-schedule
    const job = schedule.scheduleJob(scheduledDate, async () => {
      try {
        const currentDate = new Date();
        console.log(currentDate.toISOString().split("T")[0]);
        // Find all wallet transactions that have expired
        const expiredTransactions = await WalletTransaction.findAll({
          where: {
            expiryDate: {
              [Op.lte]: currentDate.toISOString().split("T")[0],
            },
          },
        });
        console.log(expiredTransactions);

        // Iterate through expired transactions
        for (const expiredTransaction of expiredTransactions) {
          // Retrieve user ID and amount from the expired transaction
          const userId = expiredTransaction.userId;
          const amount = expiredTransaction.amount;

          // Find the user's wallet amount
          const user = await User.findByPk(userId, {
            attributes: ["id", "walletAmount"],
          });
          console.log({ user });
          if (user) {
            // Deduct the amount from the user's wallet
            const remainAmt = Math.max(user.walletAmount - amount, 0);
            console.log({ remainAmt });
            console.log("+++++==", user.walletAmount);
            console.log({ amount });

            await user.update({ walletAmount: remainAmt });

            // Create a PointTransaction for the deducted amount
            const pointTran = {
              amount: amount,
              userId: userId,
              transactionSource: `${expiredTransaction.transactionSource} Expires`,
              transactionType: 2, // 2 is for Debit transactions
            };
            await PointTransaction.create(pointTran);
            //Deduct amount from Wallet transaction table and User table and update remaining amount
            exports.performOrderWalletTransaction(
              userId,
              parseFloat(amount),
              2,
              `${expiredTransaction.transactionSource} Expires`
            );
          }

          // Deduct the amount
          const updatedTransaction = {
            amount: 0,
          };

          // Save the updated transaction
          await expiredTransaction.update(updatedTransaction);
        }

        console.log("Amount deducted successfully.");
      } catch (error) {
        console.error("Error deducting expired amount:", error);
      }
    });

    // return job.name;
  } catch (error) {
    console.log(error);
  }
};
exports.addAmountWallet = async (userId, amount) => {
  try {
    // Fetch setting
    const setting = await Setting.findByPk(3);

    if (!setting) {
      throw new Error("Setting not found.");
    }

    let cashbackAmt;

    if (setting.percentage) {
      cashbackAmt = amount * (setting.percentage / 100);
    } else {
      cashbackAmt = parseFloat(setting.amount || 0);
    }

    // Calculate expiry date
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setDate(currentDate.getDate() + parseInt(setting.noOfDays));
    // Format expiry date
    const formattedExpiryDate = format(expiryDate, "yyyy-MM-dd HH:mm:ss");
    await exports.deductExpireAmount(formattedExpiryDate);
    // Update user's wallet amount
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found.");
    }

    const walletTransactions = await WalletTransaction.findAll({
      where: { userId: userId },
      order: [["id", "DESC"]],
      limit: 1,
    });

    const beforeWalletAmount = walletTransactions.length
      ? walletTransactions[0].afterWalletAmount
      : 0;
    const afterWalletAmount =
      parseFloat(beforeWalletAmount) + parseFloat(cashbackAmt);

    await user.update({ walletAmount: afterWalletAmount });

    // Create wallet transaction record
    await WalletTransaction.create({
      amount: cashbackAmt,
      beforeWalletAmount,
      afterWalletAmount,
      transactionType: 3,
      userId: userId,
      transactionSource: "Cashback Amount",
      expiryDate: formattedExpiryDate,
    });

    // Create point transaction record
    await PointTransaction.create({
      amount: cashbackAmt,
      transactionType: 1, // Cashback credit
      userId: userId,
      transactionSource: "Cashback",
      expiryDate: formattedExpiryDate,
    });
  } catch (error) {
    console.error(error);
    throw new Error("Error calculating amount.");
  }
};

exports.updateBundleStock = async (productIds) => {
  const productIdData = Array.isArray(productIds)
    ? productIds
    : JSON.parse(productIds);

  let bundleStock = [];

  if (Array.isArray(productIdData)) {
    for (let i = 0; i < productIdData.length; i++) {
      const data = productIdData[i];
      const bundles = await BundleProducts.findAll({
        where: { productId: data },
      });

      for (let j = 0; j < bundles.length; j++) {
        const element = bundles[j];
        const prod = await Product.findByPk(element.dataValues.productId);
        let noOfStock;
        let bundleIdData;

        if (element.dataValues.qty == 1) {
          noOfStock = prod.dataValues.noOfStock;
          bundleIdData = element.dataValues.bundleId;
        } else {
          bundleIdData = element.dataValues.bundleId;
          console.log("ffffffffffff", prod.dataValues.noOfStock);
          console.log("gggggggggg", element.dataValues.qty);

          noOfStock = Math.round(
            Number(prod.dataValues.noOfStock) / element.dataValues.qty
          );
        }

        if (isFinite(noOfStock)) {
          // Check if noOfStock is a finite number
          bundleStock.push({ noOfStock, bundleIdData });
        }
      }
    }

    const uniqueBundleIds = Array.from(
      new Set(bundleStock.map((item) => item.bundleIdData))
    );

    for (const bundleIdData of uniqueBundleIds) {
      const minNoOfStock = Math.min(
        ...bundleStock
          .filter((item) => item.bundleIdData === bundleIdData)
          .map((item) => item.noOfStock)
      );
      console.log({ minNoOfStock });

      await Bundles.update(
        { noOfStock: minNoOfStock },
        { where: { id: bundleIdData } }
      );
    }
  }
};
