const { request } = require("express");
const { Validator } = require("node-input-validator");
const { fn, col, Op, literal } = require("sequelize");
const db = require("../../../models/");
const {
  Bundles,
  BundleProductsImage,
  BundleProducts,
  Scheme,
  sequelize,
} = require("../../../models/");
const {
  serverError,
  success,
  validateFail,
  failed,
} = require("../../helper/response");
const { Sequelize } = require("sequelize");
const Product = db.Product;
const ProductImage = db.ProductImage;
const Vendor = db.Vendor;
const Setting = db.Setting;
const Gift = db.Gift;
const Cart = db.Cart;
const RecommendedProducts = db.RecommendedProducts;
const CatgoryWithProduct = db.CatgoryWithProduct;
let baseUrl = process.env.APP_URL;
function moveValueToTop(arr, value) {
  console.log({ value });
  const index = arr.findIndex((item) => item.id === value);
  if (index !== -1) {
    const item = arr[index];
    arr.splice(index, 1);
    arr.unshift(item);
  }
  return arr;
}
// Define the shuffleArray function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
module.exports = {
  productList: async (req, res) => {
    try {
      let request = req.query;

      const page = request.page ? parseInt(request.page) : 1;
      // const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      const search = request.search ? request.search : "";
      let params = { status: 1 };
      let bundleParams = { status: 1 };

      if (search) {
        params = Object.assign(params, {
          [Op.or]: [
            {
              productName: {
                [Op.like]: `%${search}%`,
              },
            },
            {
              compositionName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });

        bundleParams = Object.assign(bundleParams, {
          [Op.or]: [
            {
              bundleName: {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      let product = await Product.findAll({
        where: params,
        limit: parseInt(pageSize),
        offset: offset,
        include: [
          {
            model: ProductImage,
            as: "productImage",
            attributes: [
              "productImage",
              // [
              //   fn("CONCAT", baseUrl, "uploads/images/", col("productImage")),
              //   "productImage",
              // ],
            ],
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
                model: Product,
                as: "productDetails",
                attributes: ["id", "productName"],
              },
              {
                model: Gift,
                as: "giftDetails",
                attributes: [
                  "id",
                  "giftName",
                  "giftUnit",
                  "giftImage",
                  // [
                  //   fn("CONCAT", baseUrl, "uploads/images/", col("giftImage")),
                  //   "giftImage",
                  // ],
                ],
              },
            ],
          },
        ],
        order: [
          ["id", "DESC"], // Other products ordered by id
        ],
      });

      let products = [];
      const productIdToMove = 11;
      for (let index = 0; index < product.length; index++) {
        if (
          product[index].schemeDetails &&
          product[index].schemeDetails.giftProductId
        ) {
          let productDetailsNew = await Product.findOne({
            where: {
              id: product[index].schemeDetails.giftProductId
                ? product[index].schemeDetails.giftProductId
                : 0,
            },
            attributes: ["id", "productName"],
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
            ],
          });
          product[index].schemeDetails.dataValues.productDetails =
            productDetailsNew.dataValues;
        }
        let newData = {
          id: product[index].id,
          productName: product[index].productName,
          productCatId: product[index].productCatId,
          vendorId: product[index].vendorId,
          vendorName: product[index].vendorDetails
            ? product[index].vendorDetails.name || ""
            : "",
          compositionName: product[index].compositionName,
          units: product[index].units,
          smallestUnit: product[index].smallestUnit,
          noOfStock: product[index].noOfStock,
          margin: product[index].margin,
          marginPerUnit: parseFloat(product[index].marginPerUnit).toFixed(2),
          productComposition: product[index].productComposition,
          height: product[index].height,
          width: product[index].width,
          length: product[index].length,
          dimestion: product[index].dimestion,
          mrp: product[index].mrp,
          mrpPerUnit: parseFloat(product[index].mrpPerUnit).toFixed(2),
          netPrice: product[index].netPrice,
          netPricePerUnit: parseFloat(product[index].netPricePerUnit).toFixed(
            2
          ),
          productCompanyName: product[index].productCompanyName,
          createdAt: product[index].createdAt,
          updatedAt: product[index].updatedAt,
          image: product[index].productImage[0]
            ? product[index].productImage[0].productImage
            : null,

          productImage: product[index].productImage,
          schemeDetails: product[index].schemeDetails,
        };
        console.log({ productIdToMove });
        if (productIdToMove && productIdToMove === product[index].id) {
          products.unshift(newData); // Move to the top
        } else {
          products.push(newData);
        }
        products.push(newData);
      }
      const bundle = await Bundles.findAll({
        where: bundleParams,
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
                ],
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

          {
            model: Vendor,
            as: "vendorDetails",
            // attributes: ["name"],
          },
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "DESC"]],
      });

      // Merging the arrays
      // const mergedArray = [...products, ...bundle];
      const mergedArray = shuffleArray([...products, ...bundle]);

      const bundleCount = await Bundles.count();
      const productCount = await Product.count({ where: params });
      const mergeCount = parseInt(bundleCount) + parseInt(productCount);
      let data = {
        products: mergedArray,
        count: mergeCount,
      };
      return success(res, "productListed", data);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
  //product details
  productDetail: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        id: "required",
        // type: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let findProduct;
      // if (req.query.type == 1) {
      findProduct = await Product.findByPk(req.query.id, {
        include: [
          {
            model: ProductImage,
            as: "productImage",
            attributes: [
              "productImage",
              // [
              //   fn("CONCAT", baseUrl, "uploads/images/", col("productImage")),
              //   "productImage",
              // ],
            ],
          },
          {
            model: Vendor,
            as: "vendorDetails",
            // attributes: ["name"],
          },
        ],
      });
      // } else {
      //    findProduct = await Bundles.findByPk(req.query.id, {
      //     include: [
      //       {
      //         model: BundleProducts,
      //         as: "bundleProducts",
      //         include: [
      //           {
      //             model: Product,
      //             as: "productDetails",
      //             include: [
      //               {
      //                 model: ProductImage,
      //                 as: "productImage",
      //                 attributes: [
      //                   [
      //                     fn(
      //                       "CONCAT",
      //                       baseUrl,
      //                       "uploads/images/",
      //                       col("productImage")
      //                     ),
      //                     "productImage",
      //                   ],
      //                 ],
      //               },
      //             ],
      //           },
      //         ],
      //       },
      //       {
      //         model: BundleProductsImage,
      //         as: "bundleImages",
      //         attributes: [
      //           "id",
      //           [
      //             fn("CONCAT", baseUrl, "uploads/images/", col("bundleImage")),
      //             "bundleImage",
      //           ],
      //         ],
      //       },

      //       {
      //         model: Vendor,
      //         as: "vendorDetails",
      //         attributes: ["name"],
      //       },
      //     ],

      //   });
      // }

      if (!findProduct) {
        return failed(res, "productNotExist");
      }
      return success(res, "productDetailFetched", findProduct);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
  //recommand products list
  recommandProductList: async (req, res) => {
    try {
      const checkRecommandStatus = await Setting.findByPk(5);
      const userId = req.decodedData.userId;

      // console.log(checkRecommandStatus);
      let list = "";
      if (checkRecommandStatus.status == 1) {
        list = await RecommendedProducts.findAll({
          include: [
            {
              model: Product,
              as: "productDetails",
              where: { status: 1, noOfStock: { [Sequelize.Op.ne]: 0 } },
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
          where: literal(
            "productDetails.id NOT IN (SELECT productId FROM Carts WHERE userId = :userId)"
          ),
          replacements: { userId: userId },
          order: [["id", "DESC"]],
        });
      }
      const resData = {
        list: list,
        recommandProductStatus: checkRecommandStatus.status,
      };
      return success(res, "recommandCheckedStatus", resData);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },

  //View all on home screen
  viewAll: async (req, res) => {
    try {
      const validate = new Validator(req.query, {
        categoryId: "required",
      });
      const matched = await validate.check();
      if (!matched) {
        return validateFail(res, validate);
      }
      let request = req.query;
      const search = request.search ? request.search : "";
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      let params = { catId: req.query.categoryId };
      let params1 = {};
      if (search) {
        params1 = Object.assign(params1, {
          [Op.or]: [
            {
              "$productDetails.productName$": {
                [Op.like]: `%${search}%`,
              },
            },
            {
              "$productDetails.compositionName$": {
                [Op.like]: `%${search}%`,
              },
            },
          ],
        });
      }
      // console.log(params); return 1;
      const catWithProd = await CatgoryWithProduct.findAll({
        where: params,
        include: [
          {
            model: Product,
            as: "productDetails",
            where: params1,
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
                    model: Product,
                    as: "productDetails",
                    attributes: ["id", "productName"],
                  },
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
        ],
        order: [["id", "DESC"]],
        limit: parseInt(pageSize),
        offset: offset,
      });
      let updatedProducts = [];
      let count = 0;

      for (let i = 0; i < catWithProd.length; i++) {
        const productData = catWithProd[i];
        const product = productData.productDetails;

        if (product.schemeDetails && product.schemeDetails.giftProductId) {
          let productDetailsNew = await Product.findOne({
            where: {
              id: product.schemeDetails.giftProductId,
            },
            attributes: ["id", "productName"],
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
            ],
          });

          product.schemeDetails.dataValues.productDetails =
            productDetailsNew.dataValues;
        }

        let newData = {
          id: product.id,
          productName: product.productName,
          productCatId: product.productCatId,
          vendorId: product.vendorId,
          vendorName: product.vendorDetails
            ? product.vendorDetails.name || ""
            : "",
          compositionName: product.compositionName,
          units: product.units,
          smallestUnit: product.smallestUnit,
          noOfStock: product.noOfStock,
          margin: product.margin,
          marginPerUnit: parseFloat(product.marginPerUnit).toFixed(2),
          productComposition: product.productComposition,
          height: product.height,
          width: product.width,
          length: product.length,
          dimestion: product.dimestion,
          mrp: product.mrp,
          mrpPerUnit: parseFloat(product.mrpPerUnit).toFixed(2),
          netPrice: product.netPrice,
          netPricePerUnit: parseFloat(product.netPricePerUnit).toFixed(2),
          productCompanyName: product.productCompanyName,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          image: product.productImage[0]
            ? product.productImage[0].productImage
            : null,

          productImage: product.productImage,
          schemeDetails: product.schemeDetails,
        };

        // Push the updated productData to the updatedProducts array
        updatedProducts.push(newData);
        count++;
      }

      const data = updatedProducts;
      const newData = {
        count: count,
        products: data,
      };
      return success(res, "dataFetched", newData);
    } catch (error) {
      console.log(error);
      return serverError(res, "internalServerError");
    }
  },
};
