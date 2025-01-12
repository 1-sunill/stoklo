const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const {
  Bundles,
  BundleProductsImage,
  BundleProducts,
  Cart,
  Product,
  sequelize,
  Sequelize,
} = require("../../../models/");
const { Validator } = require("node-input-validator");
const { aws } = require("../../helper/aws");
const { Op, col, fn } = require("sequelize");
let baseUrl = process.env.APP_URL;

module.exports = {
  //List of bundles
  bundleList: async (req, res) => {
    try {
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let parms = {};

      if (search) {
        parms = Object.assign(parms, {
          [Op.or]: [
            {
              bundleName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      const bundle = await Bundles.findAll({
        where: parms,
        limit: parseInt(pageSize),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      const responseData = {
        count: await Bundles.count({
          where: parms,
        }),
        bundle: bundle,
      };

      return success(res, "Bundle list retrieved successfully.", responseData);
    } catch (error) {
      console.log({ error });
      return serverError(res, "Internal server error.");
    }
  },
  //Create new bundle
  createBundle: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        vendorId: "required",
        bundleName: "required",
        bundlePrice: "required",
        discountPrice: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      // console.log("+++++++++", req.body);
      const { vendorId, bundleName, type, bundlePrice, discountPrice } =
        req.body;
      const reqData = {
        vendorId,
        bundleName,
        type,
        bundlePrice,
        discountPrice,
      };

      const saveData = await Bundles.create(reqData);

      const productIds = Array.isArray(req.body.bundleProducts)
        ? req.body.bundleProducts
        : JSON.parse(req.body.bundleProducts);

      let count = 0;
      let bundleStock = [];
      if (Array.isArray(productIds)) {
        for (let i = 0; i < productIds.length; i++) {
          const product = productIds[i];
          let productCheck = await Product.findOne({
            where: { id: product.productId },
          });
          if (!productCheck) {
            return failed(res, `${product.productId} is not exist.`);
          }
          if (product.qty > productCheck.noOfStock ) {
            return failed(
              res,
              `${productCheck.productName} has only ${productCheck.noOfStock} quantity.`
            );
          }
          
          let noOfStock;
          let prodData;
          if (product.qty == 1) {
            prodData = {
              bundleId: saveData.id,
              productId: product.productId,
              qty: product.qty,
            };
            noOfStock = productCheck.noOfStock;
          } else {
            noOfStock = Math.round(
              Number(productCheck.noOfStock) / product.qty
            );

            prodData = {
              bundleId: saveData.id,
              productId: product.productId,
              qty: product.qty,
            };
          }
          bundleStock.push({ noOfStock });
          await BundleProducts.create(prodData);

          count++;
        }
      }
      const minNoOfStock = Math.min(
        ...bundleStock.map((item) => item.noOfStock)
      );
      console.log(minNoOfStock);

      // return 1;
      // Update product count in Bundle model
      await Bundles.update(
        { productCount: count, noOfStock: minNoOfStock },
        { where: { id: saveData.id } }
      );
      if (saveData && req.files && req.files.bundleImage) {
        const filesArray = Array.isArray(req.files.bundleImage)
          ? req.files.bundleImage
          : [req.files.bundleImage];

        for (const file of filesArray) {
          try {
            const bundleImageFileName = await aws(file, "bundleProduct");
            await BundleProductsImage.create({
              bundleImage: bundleImageFileName.Location,
              bundleId: saveData.id,
            });
          } catch (error) {
            console.error("Error uploading product image:", error);
          }
        }
      }
      return success(res, "Data saved successfully.", saveData);
    } catch (error) {
      console.error("Internal server error:", error);
      return serverError(res, "Internal server error.");
    }
  },
  //update bundle
  updateBundle: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        bundleId: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }

      const {
        bundleId,
        vendorId,
        bundleName,
        type,
        bundlePrice,
        discountPrice,
        // noOfStock,
      } = req.body;
      const updatedData = {
        vendorId,
        bundleName,
        type,
        bundlePrice,
        discountPrice,
        // noOfStock,
      };

      // Assuming Bundles is the Sequelize model for the bundle table
      const existingBundle = await Bundles.findByPk(bundleId);

      if (!existingBundle) {
        return failed(res, "Bundle not found.");
      }

      // Update the existing bundle
      const saveData = await Bundles.update(updatedData, {
        where: { id: bundleId },
      });

      const productIds = Array.isArray(req.body.bundleProducts)
        ? req.body.bundleProducts
        : JSON.parse(req.body.bundleProducts);

      let count = 0;
      let bundleStock = [];
      if (Array.isArray(productIds)) {
        // Clear existing products associated with the bundle
        await BundleProducts.destroy({
          where: { bundleId },
        });
        for (let i = 0; i < productIds.length; i++) {
          const product = productIds[i];
          let productCheck = await Product.findOne({
            where: { id: product.productId },
          });

          if (!productCheck) {
            return failed(res, `${product.productId} is not exist.`);
          }
          if (product.qty > productCheck.noOfStock ) {
            return failed(
              res,
              `${productCheck.productName} has only ${productCheck.noOfStock} quantity.`
            );
          }
          let noOfStock;
          let prodData;
          if (product.qty == 1) {
            prodData = {
              bundleId: bundleId,
              productId: product.productId,
              qty: product.qty,
            };
            noOfStock = productCheck.noOfStock;
          } else {
            noOfStock = Math.round(
              Number(productCheck.noOfStock) / product.qty
            );

            prodData = {
              bundleId: bundleId,
              productId: product.productId,
              qty: product.qty,
            };
          }
          bundleStock.push({ noOfStock });
          await BundleProducts.create(prodData);

          count++;
        }
      }
      const minNoOfStock = Math.min(
        ...bundleStock.map((item) => item.noOfStock)
      );
      console.log(minNoOfStock);

      // return 1;
      // Update product count in Bundle model
      await Bundles.update(
        { productCount: count, noOfStock: minNoOfStock },
        { where: { id: bundleId } }
      );
      // Update bundle images (assuming req.files.productImage contains the updated images)
      if (req.files && req.files.productImage) {
        const filesArray = Array.isArray(req.files.productImage)
          ? req.files.productImage
          : [req.files.productImage];

        // Delete existing images associated with the bundle
        await BundleProductsImage.destroy({
          where: { bundleId },
        });

        // Add updated images to the bundle
        for (const file of filesArray) {
          try {
            const productImageFileName = await aws(file, "bundleProduct");
            await BundleProductsImage.create({
              bundleImage: productImageFileName.Location,
              bundleId,
            });
          } catch (error) {
            console.error("Error uploading product image:", error);
          }
        }
      }
      return success(res, "Bundle updated successfully.");
    } catch (error) {
      console.error("Internal server error:", error);
      return serverError(res, "Internal server error.");
    }
  },
  //Detail bundle
  detailBundle: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        bundleId: "required",
      });

      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const bundle = await Bundles.findOne({
        where: { id: req.query.bundleId },
        include: [
          {
            model: BundleProducts,
            as: "bundleProducts",
            include: [
              {
                model: Product,
                as: "productDetails",
                attributes: ["id", "productName"],
              },
            ],
          },
          {
            model: BundleProductsImage,
            as: "bundleImages",
            attributes: [
              "id",
              "bundleImage",
              // [
              //   fn("CONCAT", baseUrl, "uploads/images/", col("bundleImage")),
              //   "bundleImage",
              // ],
            ],
          },
        ],
      });
      return success(res, "Data fetched successfully.", bundle);
    } catch (error) {
      console.error("Internal server error:", error);
      return serverError(res, "Internal server error.");
    }
  },
  deleteBundle: async (req, res) => {
    try {
      const validate = new Validator(req.params, {
        id: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      const bundleId = req.params.id;

      const bundle = await Bundles.findByPk(bundleId);

      if (!bundle) {
        return failed(res, "Bundle not found.");
      }

      await bundle.destroy();
      await BundleProducts.destroy({ where: { bundleId: bundleId } });
      await BundleProductsImage.destroy({ where: { bundleId: bundleId } });
      return success(res, "Bundle deleted successfully.");
    } catch (error) {
      console.error(error);
      return serverError(res, "Internal server error.");
    }
  },
  statusBundle: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        id: "required",
      });

      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }

      const bundle = await Bundles.findByPk(req.body.id);

      if (!bundle) {
        return failed(res, "Bundle not found.");
      }

      bundle.status = bundle.status === 0 ? 1 : 0;
      // Find all carts containing this bundle and toggle their status
      const bundleInCart = await Cart.findAll({
        where: { bundleId: req.body.id },
      });
      if (bundleInCart) {
        for (let i = 0; i < bundleInCart.length; i++) {
          const cartItem = bundleInCart[i];
          cartItem.status = cartItem.status === 0 ? 1 : 0;
          await cartItem.save();
        }
      }
      await bundle.save();
      res;
      return success(res, "Status updated successfully.", bundle);
    } catch (error) {
      return serverError(res, "Internal server error.");
    }
  },
};
