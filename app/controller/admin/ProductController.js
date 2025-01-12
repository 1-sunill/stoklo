const {
  success,
  failed,
  serverError,
  validateFail,
} = require("../../helper/response");
const { Validator } = require("node-input-validator");
const {
  Product,
  ProductImage,
  RecommendedProducts,
  Setting,
  Cart,
  CatgoryWithProduct,
  BundleProducts,
} = require("../../../models");
const { aws } = require("../../helper/aws");
const {
  createZohoProduct,
  updateZohoProduct,
  updateBundleStock
} = require("../../helper/helpers");
const moment = require("moment");
const { Op, fn, col } = require("sequelize");
let baseUrl = process.env.APP_URL;

//List of product
exports.productList = async (req, res) => {
  try {
    let request = req.query;
    const search = request.search ? request.search : "";
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const date = request.date ? request.date : "";

    const offset = (page - 1) * pageSize;

    let parms = {};

    if (search) {
      parms = Object.assign(parms, {
        [Op.or]: [
          {
            productName: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      });
    }
    if (date) {
      let now = moment(date).format("YYYY-MM-DD");
      parms = Object.assign(parms, {
        [Op.and]: [
          {
            createdAt: {
              [Op.gte]: now + " 00:00:00",
            },
          },
          {
            createdAt: {
              [Op.lte]: now + " 23:59:00",
            },
          },
        ],
      });
    }
    let product = await Product.findAndCountAll({
      where: parms,
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    return success(res, "Product listed successfully.", product);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};
//Insert new product
exports.createProduct = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      productName: "required",
      // productCatId: "required",
      // vendorId: "required",
      // compositionName: "required",
      // units: "required",
      // noOfStock: "required",
      // margin: "required",
      // marginPerUnit: "required",
      // productComposition: "required",
      // height: "required",
      // width: "required",
      // length: "required",
      // mrp: "required",
      // mrpPerUnit: "required",
      // netPrice: "required",
      // netPricePerUnit: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const request = req.body;
    const checkProductBySku = await Product.findOne({
      where: { sku: request.sku },
    });

    const checkProductByName = await Product.findOne({
      where: { productName: request.productName },
    });
    if (checkProductBySku) {
      return failed(res, "Product with this SKU already exists.");
    }
    // const maxSequenceId = await Product.max("orderSequence");

    let reqData = {
      productName: request.productName,
      // productCatId: request.productCatId,
      vendorId: request.vendorId,
      compositionName: request.compositionName,
      smallestUnit: request.smallestUnit,
      units: request.units,
      noOfStock: request.noOfStock,
      noOfUnitPerPack: request.noOfUnitPerPack,
      margin: request.margin,
      marginPerUnit: request.marginPerUnit,
      productComposition: request.productComposition,
      height: request.height,
      width: request.width,
      length: request.length,
      dimestion: request.dimestion,
      mrp: request.mrp,
      mrpPerUnit: request.mrpPerUnit,
      netPrice: request.netPrice,
      netPricePerUnit: request.netPricePerUnit,
      sku: request.sku,
      // weight: request.weight,
      productCompanyName: request.productCompanyName,
      // orderSequence: maxSequenceId + 1,
    };
    //craete product in zoho
    const zohoProduct = await createZohoProduct(reqData);
    // return 1;
    if (zohoProduct.data.code == 1001) {
      return failed(res, zohoProduct.data.message);
    }
    reqData.productZohoId = zohoProduct.data.item.item_id;
    // console.log(zohoProduct.data.item.item_id);
    let saveData = await Product.create(reqData);
    if (saveData) {
      if (req.files && req.files.productImage) {
        const filesArray = Array.isArray(req.files.productImage)
          ? req.files.productImage
          : [req.files.productImage];

        filesArray.forEach(async (file) => {
          try {
            const productImageFileName = await aws(file, "product");
            await ProductImage.create({
              productImage: productImageFileName.Location,
              productId: saveData.id,
            });
          } catch (error) {
            console.error("Error uploading product image:", error);
          }
        });
      }
    }

    return success(res, "Product saved successfully.", saveData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      productZohoId: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      validateFail(res, validate);
    }
    const checkProduct = await Product.findOne({
      where: { productZohoId: req.body.productZohoId },
    });
    if (!checkProduct) {
      failed(res, "Product does not exist.");
    }
    const request = req.body;
    let reqData = {
      productName: request.productName,
      // productCatId: request.productCatId,
      vendorId: request.vendorId,
      compositionName: request.compositionName ? request.compositionName : "",
      smallestUnit: request.smallestUnit ? request.smallestUnit : "",
      units: request.units ? request.units : "",
      noOfStock: request.noOfStock ? request.noOfStock : 0,
      noOfUnitPerPack: request.noOfUnitPerPack ? request.noOfUnitPerPack : 0,
      margin: request.margin ? request.margin : "",
      marginPerUnit: request.marginPerUnit ? request.marginPerUnit : 0,
      productComposition: request.productComposition
        ? request.productComposition
        : "",
      // height: request.height,
      // width: request.width,
      // length: request.length,
      dimestion: request.dimestion ? request.dimestion : "",
      mrp: request.mrp ? request.mrp : 0,
      mrpPerUnit: request.mrpPerUnit ? request.mrpPerUnit : 0,
      netPrice: request.netPrice,
      netPricePerUnit: request.netPricePerUnit ? request.netPricePerUnit : 0,
      sku: request.sku ? request.sku : "",
      weight: request.weight,
      productCompanyName: request.productCompanyName,
    };
    reqData.productId = req.body.productZohoId;
    await updateZohoProduct(reqData);

    await checkProduct.update(reqData);
    let fileName = [];
    if (req.files && req.files.productImage) {
      // Delete existing images associated with the product
      // await ProductImage.destroy({ where: { productId: req.body.id } });
      const filesArray = Array.isArray(req.files.productImage)
        ? req.files.productImage
        : [req.files.productImage];

      for (let index = 0; index < filesArray.length; index++) {
        const productImageFileName = await aws(filesArray[index], "product");
        await ProductImage.create({
          productImage: productImageFileName.Location,
          productId: checkProduct.id,
        });
        // let fineName = baseUrl + "uploads/images/" + productImageFileName.Key; //Local storage
        let fineName = productImageFileName.Location;

        fileName.push(fineName);
      }
    }
    let updatedProduct = await Product.findOne({
      where: { productZohoId: req.body.productZohoId },
    });
    let bundleProd = await BundleProducts.findAll({
      where: { productId: updatedProduct.id },
      attributes: ["productId"],
    });
    let productIdsSet = new Set(); // Using a Set to store unique IDs
    for (const bundle of bundleProd) {
      productIdsSet.add(bundle.productId);
    }

    // Convert Set back to an array
    let productIds = Array.from(productIdsSet);
 
    const bundle = await updateBundleStock(productIds);
    let data = {
      productId: updatedProduct.productZohoId,
      productName: updatedProduct.productName,
      orderSequence: updatedProduct.orderSequence,
      productCatId: updatedProduct.productCatId,
      vendorId: updatedProduct.vendorId,
      compositionName: updatedProduct.compositionName,
      units: updatedProduct.units,
      smallestUnit: updatedProduct.smallestUnit,
      noOfStock: updatedProduct.noOfStock,
      margin: updatedProduct.margin,
      marginPerUnit: updatedProduct.marginPerUnit,
      productComposition: updatedProduct.productComposition,
      noOfUnitPerPack: updatedProduct.noOfUnitPerPack,
      height: updatedProduct.height,
      width: updatedProduct.width,
      length: updatedProduct.length,
      mrp: updatedProduct.mrp,
      dimestion: updatedProduct.dimestion,
      mrpPerUnit: updatedProduct.mrpPerUnit,
      netPrice: updatedProduct.netPrice,
      netPricePerUnit: updatedProduct.netPricePerUnit,
      productCompanyName: updatedProduct.productCompanyName,
      status: updatedProduct.status,
      sku: updatedProduct.sku,
      weight: updatedProduct.weight,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
      productImage: fileName,
    };

    return success(res, "Product updated successfully.", data);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//product details
exports.productDetail = async (req, res) => {
  try {
    const validate = new Validator(req.query, {
      productZohoId: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      validateFail(res, validate);
    }
    const checkProduct = await Product.findOne({
      where: { productZohoId: req.query.productZohoId },
    });
    if (!checkProduct) {
      failed(res, "Product does not exist.");
    }
    let productDetail = await Product.findByPk(checkProduct.id, {
      include: [
        {
          model: ProductImage,
          as: "productImage",
          // attributes: [
          //   "id",
          //   [
          //     fn("CONCAT", baseUrl, "uploads/images/", col("productImage")),
          //     "productImage",
          //   ],
          // ],
        },
      ],
    });
    return success(res, "Product detail fetched successfully.", productDetail);
  } catch (error) {
    console.log(error);
    return serverError(res, "Inteernal server error.");
  }
};

//Delete Image
exports.deleteProductImage = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      productId: "required",
      productImgId: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const { productId, productImgId } = req.body;
    const checkProduct = await Product.findOne({
      where: { productZohoId: req.body.productId },
    });
    if (!checkProduct) {
      failed(res, "Product does not exist.");
    }
    await ProductImage.destroy({
      where: { productId: checkProduct.id, id: productImgId },
    });
    return success(res, "Product image deleted successfully.");
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//update status
exports.updateProductStatus = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });

    const matched = await validate.check();

    if (!matched) {
      return validateFail(res, validate);
    }

    const product = await Product.findByPk(req.body.id);

    if (!product) {
      return failed(res, "Product not found.");
    }
    product.status = product.status === 0 ? 1 : 0;
    // Find all carts containing this bundle and toggle their status
    const productInCart = await Cart.findAll({
      where: { productId: req.body.id },
    });
    if (productInCart) {
      for (let i = 0; i < productInCart.length; i++) {
        const cartItem = productInCart[i];
        cartItem.status = cartItem.status === 0 ? 1 : 0;
        await cartItem.save();
      }
    }
    await product.save();

    return success(res, "Status updated successfully.", product);
  } catch (error) {
    return serverError(res, "Internal server error");
  }
};

//prodcut lisr for Recommanded products
exports.productListing = async (req, res) => {
  try {
    const productList = await Product.findAll({
      where: { status: 1 },
      order: [["id", "DESC"]],
    });
    if (req.query.categoryId) {
      for (let i = 0; i < productList.length; i++) {
        productList[i].dataValues.isSelected =
          (await CatgoryWithProduct.findOne({
            where: {
              catId: req.query.categoryId,
              productId: productList[i].id,
            },
          }))
            ? true
            : false;
      }
    }
    return success(res, "Product list fetched successfully.", productList);
  } catch (error) {
    console.log({ error });
    return serverError(res, "Internal server error");
  }
};

//Recommanded products
exports.recommandProduct = async (req, res) => {
  try {
    const validationRules = {
      productId: "required|array",
    };

    const validate = new Validator(req.body, validationRules);
    const isValidationPassed = await validate.check();

    if (!isValidationPassed) {
      return validateFail(res, validate);
    }
    const { productId } = req.body;
    for (let i = 0; i < productId.length; i++) {
      const productID = productId[i];
      // Check if the category exists
      const product = await Product.findByPk(productID);
      if (!product) {
        return failed(res, `Product with ID ${productID} does not exist.`);
      }

      // Check if the association record exists
      let recmondProduct = await RecommendedProducts.findOne({
        where: { productId: productID },
      });

      if (!recmondProduct) {
        //Check recommand Product is exist or not
        const reqData = {
          productId: productID,
          isChecked: 1,
        };

        await RecommendedProducts.create(reqData);
      } else {
        // If the record exists, update the isChecked field
        recmondProduct.isChecked = recmondProduct.isChecked === 0 ? 1 : 0;
        await recmondProduct.save();
      }
    }

    return success(
      res,
      "Recommended Products checked status updated successfully."
    );
  } catch (error) {
    return serverError(res, "Internal server error");
  }
};

//recommand products list
exports.recommandProductList = async (req, res) => {
  try {
    const checkRecommandStatus = await Setting.findByPk(5);

    // console.log(checkRecommandStatus);
    let list = "";
    if (checkRecommandStatus.status == 1) {
      list = await RecommendedProducts.findAll({
        include: [
          {
            model: Product,
            as: "productDetails",
          },
        ],
        order: [["id", "DESC"]],
      });
    }
    const resData = {
      list: list,
      recommandProduct: checkRecommandStatus,
    };
    return success(
      res,
      "Recommended Products checked status updated successfully.",
      resData
    );
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error");
  }
};

//delete recommanded
exports.deleteRecommandedProduct = async (req, res) => {
  try {
    const validate = new Validator(req.params, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const productId = req.params.id;

    const product = await RecommendedProducts.findByPk(productId);

    if (!product) {
      return serverError(res, "Recomanded Product not found.");
    }

    await product.destroy();

    return success(res, "Data deleted successfully.");
  } catch (error) {
    return serverError(res, "Internal server error");
  }
};
