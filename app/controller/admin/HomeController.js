const { Validator } = require("node-input-validator");
const Home = require("../../../models/").Home;
const QuikMenu = require("../../../models/").QuikMenu;
const {
  validateFail,
  success,
  serverError,
  failed,
} = require("../../helper/response");

//Home configuration list
exports.homeConfigList = async (req, res) => {
  try {
    const items = await Home.findAll({ order: [["order", "ASC"]] });

    return success(res, "Home configuration list.", items);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal Server Error.");
  }
};
//Quik menu list
exports.quikMenuList = async (req, res) => {
  try {
    const items = await QuikMenu.findAll({ order: [["order", "ASC"]] });

    return success(res, "Quik menu list.", items);
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal Server Error.");
  }
};

//Manage home configuration
exports.manageHome = async (req, res) => {
  const originalShiftId = parseInt(req.body.originalShiftId);
  const newShiftId = parseInt(req.body.newShiftId);

  try {
    // Fetch the items to get their current orders
    const originalItem = await Home.findOne({
      where: { order: originalShiftId },
    });
    const newItem = await Home.findOne({ where: { order: newShiftId } });

    // Check if items exist
    if (!originalItem || !newItem) {
      return res.status(404).json({ error: "One or both items not found." });
    }

    // Swap the order values
    const tempOrder = originalItem.order;
    originalItem.order = newItem.order;
    newItem.order = tempOrder;

    // Update the order of the swapped items
    await originalItem.save();
    await newItem.save();

    // Fetch the updated items
    const updatedItems = await Home.findAll({ order: [["order", "ASC"]] });

    return success(res, "Home configuration updated list.", updatedItems);
  } catch (error) {
    console.error(error);
    return serverError(res, "Internal Server Error.");
  }
};

//update home configuration status
exports.updateHomeStatus = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let home = await Home.findOne({ where: { id: req.body.id } });
    if (!home) {
      return failed(res, "Home id is not valid.");
    } else {
      home.status = home.status === 0 ? 1 : 0;
      await home.save();
      return success(res, "Status updated successfully.", home);
    }
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal Server Error.");
  }
};

//Manage Quik Menus
exports.manageQuikMenu = async (req, res) => {
  try {
    const originalShiftId = parseInt(req.body.originalShiftId);
    const newShiftId = parseInt(req.body.newShiftId);

    // Fetch the items to get their current orders
    const originalItem = await QuikMenu.findOne({
      where: { order: originalShiftId },
    });
    const newItem = await QuikMenu.findOne({ where: { order: newShiftId } });

    // Check if items exist
    if (!originalItem || !newItem) {
      return res.status(404).json({ error: "One or both items not found." });
    }

    // Swap the order values
    const tempOrder = originalItem.order;
    originalItem.order = newItem.order;
    newItem.order = tempOrder;

    // Update the order of the swapped items
    await originalItem.save();
    await newItem.save();

    // Fetch the updated items from the QuikMenu model (adjust based on your model structure)
    const updatedItems = await QuikMenu.findAll({ order: [["order", "ASC"]] });

    return success(res, "Quik Menu updated list.", updatedItems);
  } catch (error) {
    console.error("Error in manageQuikMenu:", error);
    return serverError(res, "Internal server error.");
  }
};
//update Quik Menu status
exports.updateQuikMenu = async (req, res) => {
  try {
    const validate = new Validator(req.body, {
      id: "required",
    });
    const matched = await validate.check();
    if (!matched) {
      return validateFail(res, validate);
    }
    let quikMenu = await QuikMenu.findOne({ where: { id: req.body.id } });
    if (!quikMenu) {
      return failed(res, "Quik menu id is not valid.");
    } else {
      quikMenu.status = quikMenu.status === 0 ? 1 : 0;
      await quikMenu.save();
      return success(res, "Status updated successfully.", quikMenu);
    }
  } catch (error) {
    console.log(error);
    return serverError(res, "Internal Server Error.");
  }
};
