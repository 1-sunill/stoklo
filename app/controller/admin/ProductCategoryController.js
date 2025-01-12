const { Validator } = require("node-input-validator");
const { Op } = require("sequelize");
const {
  serverError,
  validateFail,
  failed,
  success,
} = require("../../helper/response");
const db = require("../../../models/");
const ProductCategory = db.ProductCategory;
const Product = db.Product;
const CategoryWithProdct = db.CatgoryWithProduct;
const Home = db.Home;

//Insert new  category
exports.insertProductCategory = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      categoryName: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const request = req.body;
    let checkCategoryIsExist = await ProductCategory.findOne({
      where: { categoryName: request.categoryName },
    });
    if (checkCategoryIsExist) {
      return failed(res, "Product category already exist.");
    }
    let reqData = {
      categoryName: request.categoryName,
    };
    await ProductCategory.create(reqData);
    return success(res, "Product category created successfully.", reqData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//list of  category
exports.categoryList = async (req, res) => {
  try {
    const request = req.query;
    const page = request.page ? parseInt(request.page) : 1;
    const pageSize = request.limit ? request.limit : process.env.PAGE_LIMIT;
    const search = request.search;

    let parms = {};
    if (search) {
      parms = Object.assign(parms, {
        [Op.or]: [
          {
            categoryName: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      });
    }
    const offset = (page - 1) * pageSize;

    const catList = await ProductCategory.findAndCountAll({
      where: parms,
      limit: parseInt(pageSize),
      offset: offset,
      order: [["id", "DESC"]],
    });
    return success(res, "Category list", catList);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//Status update category
exports.updateProductCatStatus = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let cat = await ProductCategory.findByPk(req.body.id);
    if (!cat) {
      return failed(res, "This category does not exist.");
    }
    cat.status = cat.status === 0 ? 1 : 0;
    await cat.save();

    return success(res, "Category updated successfully.");
  } catch (error) {
    return serverError(res, "Internal server error.");
  }
};

//category details
exports.categoryDetails = async (req, res) => {
  try {
    const validate = new Validator(req.query, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let category = await ProductCategory.findByPk(req.query.id);
    const catName = await CategoryWithProdct.findAndCountAll({
      where: { catId: req.query.id },
      attributes: ["productId"],
      include: {
        model: Product,
        as: "productDetails",
      },
    });
    const productDetails = Array.from(
      catName.rows,
      (row) => row.productDetails
    );

    // let products = await Product.findAll({
    //   where: { productCatId: req.query.id },
    //   attributes: ["productName", "status"],
    //
    // });
    let resData = {
      categoryName: category.categoryName,
      categoryStatus: category.status,
      count: await CategoryWithProdct.count({
        where: { catId: req.query.id },
      }),
      products: productDetails,
    };
    return success(res, "Category details.", resData);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//update category
exports.updateProductCategory = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
      categoryName: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }

    const { id, categoryName } = req.body;
    let productCategory = await ProductCategory.findByPk(id);

    if (!productCategory) {
      return failed(res, "Product category doesn't exist.");
    }

    const reqData = {
      categoryName: categoryName,
    };
    //Also update name in home configration category
    const homeCategory = await Home.findOne({
      where: { categoryId: id },
    });
    if (homeCategory) {
      await homeCategory.update({
        name: categoryName,
      });
    }
    await productCategory.update(reqData);
    return success(res, "Category updated successfully.");
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error.");
  }
};

//delete category
exports.deleteCategory = async (req, res) => {
  try {
    const validate = new Validator(req.params, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    const categoryId = req.params.id;

    const productCategory = await ProductCategory.findByPk(categoryId);

    if (!productCategory) {
      return serverError(res, "Category not found.");
    }

    await productCategory.destroy();

    return success(res, "Category deleted successfully.");
  } catch (error) {
    console.error(error);
    return serverError(res, "Internal server error.");
  }
};

//update product order sequence
exports.updateProductSequence = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      originalShiftId: "required",
      newShiftId: "required",
    });

    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }

    const originalShiftId = parseInt(req.body.originalShiftId);
    const newShiftId = parseInt(req.body.newShiftId);

    const items = await CategoryWithProdct.findAll();

    const originalIndex = items.findIndex(
      (item) => item.orderSequence === originalShiftId
    );
    const newIndex = items.findIndex(
      (item) => item.orderSequence === newShiftId
    );

    if (originalIndex > -1 && newIndex > -1) {
      const movedItem = items.splice(originalIndex, 1);
      items.splice(newIndex, 0, ...movedItem);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const updatedOrderSequence = i + 1;

      await CategoryWithProdct.update(
        { orderSequence: updatedOrderSequence },
        {
          where: { id: item.id },
        }
      );
    }

    return success(res, "Product configuration updated list.", items);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error");
  }
};

//Add or update products with category
exports.categoryWithProducts = async (req, res) => {
  try {
    console.log(12);
    const validationRules = {
      categoryId: "required",
      productId: "required|array",
      "productId.*": "required",
    };

    const validate = new Validator(req.body, validationRules);
    const isValidationPassed = await validate.check();

    if (!isValidationPassed) {
      return validateFail(res, validate);
    }

    const { categoryId, productId } = req.body;

    // Check if the category exists
    const category = await ProductCategory.findByPk(categoryId);

    if (!category) {
      return failed(res, "Category does not exist.");
    }

    // Check if the products exist
    const products = await Product.findAll({
      where: {
        id: {
          [Op.in]: productId,
        },
      },
    });

    if (products.length !== productId.length) {
      return failed(res, "One or more products do not exist.");
    }

    // Delete existing associations
    await CategoryWithProdct.destroy({
      where: {
        catId: categoryId,
      },
    });

    // Create new associations with updated order sequences
    for (let index = 0; index < productId.length; index++) {
      const prodId = productId[index];
      const reqData = {
        catId: categoryId,
        productId: prodId,
        isChecked: 1,
        status: 1,
        orderSequence: index + 1,
      };

      await CategoryWithProdct.create(reqData);
    }
    // // Loop through each product
    // for (const prodId of productId) {
    //   // Check if the association record exists
    //   let catWithProd = await CategoryWithProdct.findOne({
    //     where: { catId: categoryId, productId: prodId },
    //   });
    //   // if (!catWithProd) {
    //   // If the record does not exist, create a new one
    //   const maxSequenceId = await CategoryWithProdct.max("orderSequence");
    //   const nextOrderSequence = maxSequenceId != null ? maxSequenceId + 1 : 1;

    //   const reqData = {
    //     catId: categoryId,
    //     productId: prodId,
    //     isChecked: 1,
    //     status: 1,
    //     orderSequence: nextOrderSequence,
    //   };

    //   await CategoryWithProdct.create(reqData);
    //   // } else {
    //   //   // If the record exists, update the isChecked field
    //   //   catWithProd.isChecked = catWithProd.isChecked === 0 ? 1 : 0;
    //   //   await catWithProd.save();
    //   // }
    // }

    return success(res, "Products checked status updated successfully.");
  } catch (error) {
    console.error(error);
    return serverError(res, "Internal server error");
  }
};

//update product with category status
exports.categoryWithProductsStatus = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let catWithProd = await CategoryWithProdct.findByPk(req.body.id);
    if (!catWithProd) {
      return failed(res, "This category does not exist.");
    }
    catWithProd.status = catWithProd.status === 0 ? 1 : 0;
    await catWithProd.save();
    return success(res, "Status updated successfully");
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal server error");
  }
};

//update home configuration category
exports.updateHomeConfigCategory = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });

    const isValid = await validate.check();
    if (!isValid) {
      return validateFail(res, validate);
    }
    // Find all home categories with a specific category ID
    const allHomeCategories = await Home.findAll({
      where: {
        categoryId: { [Op.ne]: 0 }, // Assuming 0 is not a valid category ID
      },
    });

    // Check if there are multiple entries for the same category ID using a for loop
    for (let i = 0; i < allHomeCategories.length; i++) {
      const categoryId = allHomeCategories[i].categoryId;
      if (categoryId == req.body.id) {
        return failed(
          res,
          "The categories you wish to update must be different."
        );
      }
    }
    if (!req.body.catId) {
      return failed(res, "Please specify the category ID to deactivate");
    }
  
    const sourceCategory = await ProductCategory.findByPk(req.body.id);
    if (!sourceCategory) {
      return failed(res, "Source category not found.");
    }

    const destinationCategory = await ProductCategory.findByPk(req.body.catId);
    if (!destinationCategory) {
      return failed(res, "Destination category not found.");
    }

    await sourceCategory.update({ activeOnHome: 1 });
    await destinationCategory.update({ activeOnHome: 0 });

    const homeCategory = await Home.findOne({
      where: { categoryId: req.body.catId },
    });

    if (homeCategory) {
      await homeCategory.update({
        name: sourceCategory.categoryName,
        categoryId: req.body.id,
      });
    } else {
      // Handle the case where Home category is not found for the specified catId
      return failed(res, "Home category not found for the specified catId.");
    }

    return success(res, "Data updated successfully.");
  } catch (error) {
    console.error({ error });
    return serverError(res, "Internal server error.");
  }
};
