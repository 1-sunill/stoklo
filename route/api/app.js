const express = require("express");
const router = express.Router();
const UserController = require("../../app/controller/api/UserController");
const CommonController = require("../../app/controller/api/CommonController");
const ProductController = require("../../app/controller/api/ProductController");
const CartController = require("../../app/controller/api/CartController");
const OrderController = require("../../app/controller/api/OrderController");
const OfferController = require("../../app/controller/api/OfferController");
const PaymentController = require("../../app/controller/api/PaymentController");
const auth = require("../../app/middleware/AppAuth");

/********************* Auth Management ***********************/
router.post("/login", UserController.login);
router.post("/verify-otp", UserController.verifyOtp);
router.get("/licence-list", UserController.licenceList);
router.get("/onboarding-bonus-point", CommonController.onBoardingBonus);
router.get("/cash-back", CommonController.cashBack);
router.get("/refer-and-earn-point", CommonController.referAndEarn);
router.get("/ownership-type-list", CommonController.ownershipTypeList);
router.get("/language-list", CommonController.languageList);
router.get("/term-condition", CommonController.termCondition);
router.get("/privacy-policy", CommonController.privacyPolicy);
router.get("/about-us", CommonController.aboutUs);

router.get("/home-configuration", auth, CommonController.homeScreen);
router.post("/help-support", auth, CommonController.helpsupport);
router.post("/notification-status", auth, CommonController.notificationStatus);
router.post("/order-help-support", auth, CommonController.orderHelpsupport);
router.post("/insert-licence-details", auth, UserController.insertLicence);
router.post("/onboarding-bonus", auth, UserController.onBoardingBonus);
router.get("/wallet-transactions", auth, UserController.walletTransactions);
router.post("/digital-shotbook", auth, CommonController.digitalShotbook);
router.get("/training-list", auth, CommonController.trainingList);
router.get(
  "/digital-shotbook-list",
  auth,
  CommonController.digitalShotbookList
);
router.get("/notification-list", auth, CommonController.notificationList);
router.post("/spin-wheel", auth, CommonController.spinWheel);
router.get("/latest-spin", auth, CommonController.spinTime);
router.get("/user-winning-list", auth, CommonController.userWinningList);
router.get("/product-cat-list", CommonController.categoryList);

// router.use(auth);
router.post("/update-user-details", auth, UserController.updateUserDetails);
router.get("/user-detail", auth, UserController.userDetails);
router.post("/delete-account", auth, UserController.deleteAccount);
router.post("/send-update-request", auth, UserController.sendRequestForUpdate);
router.get("/rejected-profile", auth, UserController.rejectProfileStatus);

/********************* Product Management ***********************/
router.get("/product-list", auth, ProductController.productList);
router.get("/product-detail", auth, ProductController.productDetail);
router.get(
  "/rocommanded-products-list",
  auth,
  ProductController.recommandProductList
);
router.get("/view-all-filtered-products", ProductController.viewAll);

/********************* Cart Management ***********************/
router.post("/add-to-cart", auth, CartController.addToCart);
router.get("/cart-list", auth, CartController.cartList);
router.post("/apply-coupon", auth, CartController.applyCoupon);
router.post("/repeat-cart", auth, CartController.repeatCart);

/********************* Order Management ***********************/
router.post("/create-order", auth, OrderController.createOrder);
router.post("/cancel-order", auth, OrderController.cancelOrder);
router.get("/order-history", auth, OrderController.orderHistory);
router.get("/order-detail", auth, OrderController.orderDetail);

/******************** Offer Management **********************/
router.get("/offers-list", auth, OfferController.offerList);
router.get("/offers-detail", auth, OfferController.offerDetail);

/******************** Payment Management **********************/

router.post("/payment", auth, PaymentController.newPayment);
router.post("/payment/status", PaymentController.status);
router.get("/payment/success", PaymentController.success);
router.get("/payment/failed", PaymentController.failed);

module.exports = router;
