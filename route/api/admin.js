const express = require("express");
const router = express.Router();
const HomeController = require("../../app/controller/admin/HomeController");
const AdminController = require("../../app/controller/admin/AuthController");
const ProductCategoryController = require("../../app/controller/admin/ProductCategoryController");
const ProductController = require("../../app/controller/admin/ProductController");
const GameController = require("../../app/controller/admin/GameController");
const RetailerController = require("../../app/controller/admin/RetailerController");
const PointsController = require("../../app/controller/admin/PointsController");
const BannerController = require("../../app/controller/admin/BannerController");
const VendorController = require("../../app/controller/admin/VendorController");
const CommonController = require("../../app/controller/admin/CommonController");
const OrderController = require("../../app/controller/admin/OrderController");
const OfferController = require("../../app/controller/admin/OfferController");
const WaletController = require("../../app/controller/admin/WalletManagementController");
const NotificationController = require("../../app/controller/admin/NotificationController");
const DigitalShotbookController = require("../../app/controller/admin/DigitalShotbookController");
const TrainingController = require("../../app/controller/admin/TrainingController");
const SchemeController = require("../../app/controller/admin/SchemeController");
const BundleController = require("../../app/controller/admin/BundleController");
const SubAdminController = require("../../app/controller/admin/SubAdminContrller");

const auth = require("../../app/middleware/adminAuth");
const adminAuth = require("../../app/middleware/adminAuth");
/********************* Admin Management ***********************/

router.post("/login", AdminController.adminLogin);
router.post("/forgot-password", AdminController.forgotPassword);
router.post("/change-password", AdminController.changePassword);

/********************* Manage home configuration ***********************/
router.get("/product-cat-list", ProductCategoryController.categoryList);
router.get("/slices-list", GameController.slicesList);

// router.use(auth);
router.get("/home-config-list", HomeController.homeConfigList);
router.get("/quik-menu-list", HomeController.quikMenuList);

router.post("/home", HomeController.manageHome);
router.post("/home/update-status", HomeController.updateHomeStatus);
router.post("/quik-menus", HomeController.manageQuikMenu);
router.post("/quik-menus/update-quik-menus", HomeController.updateQuikMenu);

/********************* Product Category management ***********************/
router.post(
  "/create-product-category",
  ProductCategoryController.insertProductCategory
);
router.post(
  "/update-product-cat-status",
  ProductCategoryController.updateProductCatStatus
);
router.post(
  "/update-category",
  ProductCategoryController.updateProductCategory
);
router.delete("/delete-category/:id", ProductCategoryController.deleteCategory);
router.get("/category-details", ProductCategoryController.categoryDetails);
router.post(
  "/update-product-sequence",
  ProductCategoryController.updateProductSequence
);
router.post(
  "/category-with-products",
  ProductCategoryController.categoryWithProducts
);
router.post(
  "/category-with-products-status",
  ProductCategoryController.categoryWithProductsStatus
);
router.post(
  "/home-category-manage",
  ProductCategoryController.updateHomeConfigCategory
);
/********************* Product management ***********************/

router.post("/update-product", ProductController.updateProduct);
router.post("/create-product", ProductController.createProduct);
router.get("/product-list", ProductController.productList);
router.get("/product-detail", ProductController.productDetail);
router.post("/delete-product-image", ProductController.deleteProductImage);
router.post("/update-product-status", ProductController.updateProductStatus);
router.get("/products-list", ProductController.productListing);
router.post("/add-recommanded-product", ProductController.recommandProduct);
router.get(
  "/rocommanded-products-list",
  ProductController.recommandProductList
);
router.delete(
  "/delete-recommanded/:id",
  ProductController.deleteRecommandedProduct
);

/********************* Game management ***********************/

router.post("/slices-update", GameController.manageSwing);

/********************* Retailer management ***********************/

router.get("/retailer-list", auth, RetailerController.retailerList);
router.get("/retailer-requests-list", RetailerController.retailerRequestsList);
router.get("/ownership-list", RetailerController.ownerShipList);
router.get("/retailer-detail", RetailerController.retailerDetail);
router.post("/update-retailer-status", RetailerController.retailerStatusUpdate);
router.post("/update-retailer", RetailerController.retailerUpdate);
router.post("/approve-retailer", RetailerController.approveRetailer);
router.post("/reject-retailer", RetailerController.rejectRetailer);
router.post("/create-retailer", RetailerController.createRetailer);
router.get("/user-order-detail", RetailerController.userOrderDetail);
router.get("/user-delete-requests", RetailerController.userDeleteRequest);
router.post("/user-delete/", RetailerController.userDelete);
router.post("/approve-users-request", RetailerController.approveUserRequest);

/********************* Points management ***********************/
router.post("/update-points", PointsController.updatePoints);
router.post("/create-deliery-charges", PointsController.createDeliveryCharges);
router.post("/update-delivery-charges", PointsController.updateDeliveryCharges);
router.delete(
  "/delete-delivery-charges/:id",
  PointsController.deleteDeliveryCharges
);
router.get("/delivery-list", PointsController.listDeliveryCharges);

/********************* Banner management ***********************/
router.post("/insert-banner", BannerController.bannerInsert);
router.get("/banner-list", BannerController.bannerList);
router.post("/update-banner", BannerController.updateBanner);
router.post("/update-banner-status", BannerController.bannerStatus);
router.delete("/delete-banner", BannerController.bannerDelete);

/********************* Vendor management ***********************/
router.post("/insert-vendor", VendorController.createVendor);
router.get("/list-vendor", VendorController.listVendor);
router.post("/edit-vendor", VendorController.editVendor);
router.get("/detail-vendor", VendorController.detailVendor);

/********************* Order management ***********************/
router.get("/orders-list", OrderController.orderList);
router.get("/order-detail", OrderController.orderDetails);
router.post("/update-order-status", OrderController.updateOrderStatus);
router.post("/cancel-order", OrderController.cancelOrder);
router.post("/refund-payment", OrderController.refundPayment);

/********************* Offer management ***********************/
router.get("/list-offers", OfferController.offerList);
router.post("/create-offer", OfferController.createOffer);
router.get("/view-offer", OfferController.offerDetail);
router.post("/edit-offer", OfferController.editOffer);
router.post("/status-offer", OfferController.statusOffer);
router.delete("/delete-offer/:id", OfferController.deleteOffer);
router.get("/spin-offer-list", OfferController.spinWheelOfferList);
/********************* Wallet management ***********************/
router.get("/list-wallet", WaletController.walletList);
router.get("/user-wallet-detail", WaletController.userWalletDetail);
router.post("/credit-wallet", WaletController.creditWallet);
router.post("/debit-wallet", WaletController.debitWallet);

/********************* Notification management ***********************/
router.get("/users-list", NotificationController.usersList);
router.post("/send-notification", NotificationController.sendNotification);
router.get("/notification-list", NotificationController.notificationList);

/********************* Digital Shotbook management ***********************/
router.get("/digital-shotbook-list", DigitalShotbookController.list);
router.post("/add-to-cart", DigitalShotbookController.addToCart);
router.post("/update-cart", DigitalShotbookController.updateCart);
router.get("/cart-list", DigitalShotbookController.cartList);

/********************* Training management ***********************/
router.post("/add-training-url", TrainingController.addTrainingUrl);
router.post("/update-training-url", TrainingController.updateTrainingUrl);
router.get("/training-list", TrainingController.trainingList);
router.delete("/delete-training/:id", TrainingController.deleteTraining);

/********************* Scheme and Gift management ***********************/
//Gift
router.get("/gift-list", SchemeController.giftList);
router.get("/gift-details", SchemeController.giftDetails);
router.post("/create-gift", SchemeController.createGift);
router.post("/update-gift", SchemeController.updateGift);
router.delete("/delete-gift/:id", SchemeController.deleteGift);
router.post("/update-scheme-status", SchemeController.updateSchemeStatus);

//Scheme
router.get("/scheme-list", SchemeController.schemeList);
router.get("/scheme-details", SchemeController.schemeDetails);
router.post("/create-scheme", SchemeController.createScheme);
router.post("/update-scheme", SchemeController.updateScheme);
router.delete("/delete-scheme/:id", SchemeController.deleteScheme);
router.get("/spin-scheme", SchemeController.spinThwheelSchemeList);

/********************* Bundle management ***********************/
router.post("/create-bundle", BundleController.createBundle);
router.post("/update-bundle", BundleController.updateBundle);
router.get("/bundle-list", BundleController.bundleList);
router.get("/bundle-detail", BundleController.detailBundle);
router.delete("/delete-bundle/:id", BundleController.deleteBundle);
router.post("/change-bundle-status", BundleController.statusBundle);

/********************* Subadmin management ***********************/
router.get("/module-list", SubAdminController.moduleList);
router.get("/access-list", SubAdminController.accessList);
router.get("/subadmin-detail", SubAdminController.subadminDetail);
router.get("/subadmin-list", SubAdminController.subAdminList);
router.post("/create-subadmin", SubAdminController.craeteSubadmin);
router.post("/update-subadmin", SubAdminController.updateSubadmin);
router.post("/update-sub-admin-status", SubAdminController.updateStatus);

router.get("/help-support", CommonController.helpSupportList);
router.get("/dashboard", CommonController.dashboard);
router.get("/order-help-support", CommonController.orderHelpSupportList);
router.get("/setting", CommonController.setting);
router.post("/update-setting-data", CommonController.updateSettingData);
router.post("/update-setting-status", CommonController.updateSettingStatus);
router.get("/cms-list", CommonController.cmsList);
router.post("/cms-update", CommonController.updateCms);
router.get("/detail-cms", CommonController.detailCms);
router.get("/winning-list", GameController.wiiningList);

module.exports = router;
