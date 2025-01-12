const { async } = require("@firebase/util");
const { stringify } = require("circular-json");
const { Validator } = require("node-input-validator");
const { fn, col } = require("sequelize");
const {
  DigitalShotBook,
  User,
  Cart,
  Product,
  ProductImage,
  Vendor,
} = require("../../../models");
const {
  serverError,
  success,
  failed,
  validateFail,
} = require("../../helper/response");
let baseUrl = process.env.APP_URL;

module.exports = {
  //Digital shot book list
  list: async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const pageSize = req.query.limit
        ? req.query.limit
        : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;
      const list = await DigitalShotBook.findAll({
        attributes: [
          "id",
          "userId",
          "status",
          "shopBookimage",
          // [
          //   fn("CONCAT", baseUrl, "uploads/images/", col("shopBookimage")),
          //   "shopBookimage",
          // ],
          "cartJson",
          "createdAt",
        ],
        include: [
          {
            model: User,
            as: "UserDetail",
          },
        ],
        // group: ["userId"],
        order: [["id", "desc"]],
        limit: parseInt(pageSize),
        offset: offset,
      });
      const newData = {
        count: await DigitalShotBook.count(),
        data: list,
      };
      return success(res, "Data fetched successfully.", newData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  addToCart: async (req, res) => {
    try {
      const productWithQty = req.body.data;

      const digitalCartId = req.body.digitalCartId;
      //Check user exist
      let checkUser = await User.findOne({
        where: { id: req.body.userId },
      });

      if (!checkUser) {
        return failed(res, "User not found.");
      }

      //Check digital cart is available
      let checkDigitalCart = await DigitalShotBook.findOne({
        where: { id: digitalCartId },
      });

      checkDigitalCart.update({ cartJson: stringify(productWithQty) });
      // console.log(checkDigitalCart); return 1;

      if (!checkDigitalCart) {
        return failed(res, "Digital Shotbook not found.");
      }
      // await Cart.destroy({
      //   where: { userId: req.body.userId },
      // });
      for (const product of productWithQty) {
        let checkProduct = await Product.findOne({
          where: { id: product.productId },
        });

        // if (!checkProduct) {
        //   return failed(res, `Product '${product.productId}' not exist.`);
        // }
        // if (checkProduct.noOfStock == 0) {
        //   return failed(res, `Product '${product.productId}' is out of stock.`);
        // }
        if (checkProduct.noOfStock < product.qty) {
          return failed(res, "Insufficient quantity.");
        }
        // console.log(product); return 1;

        //Insert product into the cart
        // let reqData = {
        //   productId: product.productId,
        //   quantity: product.qty,
        //   userId: req.body.userId,
        //   addedBy: 1,
        // };
        // await Cart.create(reqData);
      }
      //When products is added in cart then upadte statuss
      await checkDigitalCart.update({ status: 2 });
      return success(res, "Item added in the cart successfully.");
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
  //Update cart
  updateCart: async (req, res) => {
    try {
      const validate = new Validator(req.body, {
        userId: "required",
        product_id: "required",
        quantity: "required",
      });
      const matched = await validate.check();

      if (!matched) {
        return validateFail(res, validate);
      }
      const { product_id, quantity, userId } = req.body;
      let checkUser = await User.findOne({
        where: { id: userId },
      });
      if (!checkUser) {
        return failed(res, "User not found.");
      }
      let checkProduct = await Product.findOne({
        where: { id: product_id },
      });

      if (!checkProduct) {
        return failed(res, "Product not exist.");
      }
      if (checkProduct.noOfStock == 0) {
        return failed(res, "Product is out of stock.");
      }
      if (checkProduct.noOfStock < quantity) {
        return failed(res, "Insufficient quantity.");
      }
      let checkCart = await Cart.findOne({
        where: { userId: userId, productId: product_id },
      });

      if (checkCart) {
        if (quantity == 0) {
          // Delete from the cart if the request quantity is 0
          await checkCart.destroy();
          return success(res, "Item removed from the cart successfully.");
        } else {
          await checkCart.update({
            quantity: parseInt(quantity),
          });
          return success(res, "Cart updated successfully.", checkCart);
        }
      }
      return success(res, "Cart updated successfully.", checkCart);
    } catch (error) {
      console.log(error);

      return serverError(res, "Internal server error.");
    }
  },
  //CartList
  cartList: async (req, res) => {
    try {
      let request = req.query;
      const userId = req.query.userId;
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
      const offset = (page - 1) * pageSize;

      let cartList = await Cart.findAll({
        where: { userId: userId },
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
                attributes: ["name"],
              },
            ],
          },
        ],
        limit: parseInt(pageSize),
        offset: offset,
        order: [["id", "desc"]],
      });
      let cartData = [];
      for (let index = 0; index < cartList.length; index++) {
        let product = await Product.findOne({
          where: { id: cartList[index].productId },
          attributes: ["noOfStock"],
        });
        let itemPrice =
          cartList[index].quantity * cartList[index].productDetails.netPrice;
        let newData = {
          id: cartList[index].id,
          productId: cartList[index].productId,
          userId: cartList[index].userId,
          quantity: cartList[index].quantity,
          createdAt: cartList[index].createdAt,
          updatedAt: cartList[index].updatedAt,
          productDetails: cartList[index].productDetails,
          itemPrice: itemPrice,
          image: cartList[index].productDetails.productImage[0]
            ? cartList[index].productDetails.productImage[0].productImage
            : null,
        };

        if (product.noOfStock < cartList[index].quantity) {
          newData = Object.assign(newData, {
            availableQuantity: parseInt(product.noOfStock),
          });
        }

        cartData.push(newData);
      }
      // Calculate total amount of all cart items
      const sumTotalAmount = cartList.reduce(
        (accumulator, cartProduct) =>
          accumulator +
          cartProduct.quantity * cartProduct.productDetails.netPrice,
        0
      );

      let newData = {
        count: await Cart.count({
          where: { userId: userId },
        }),
        cartData: cartData,
        calculatedAmount: sumTotalAmount ? sumTotalAmount : 0,
      };
      return success(res, "Cart data fetched successfully.", newData);
    } catch (error) {
      console.log(error);
      return serverError(res, "Internal server error.");
    }
  },
};
