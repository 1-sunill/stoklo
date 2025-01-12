const admin = require("./api/admin");
const application = require("./api/app");

module.exports = function (app) {
  app.use("/api", application);
  app.use("/admin", admin);
};
