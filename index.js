const express = require("express");
const bodyParser = require("body-parser");
const swaggerDefinitionOfApp = require("./config/applicationSwagger.json");
const swaggerDefinitionOfAdmin = require("./config/adminSwagger.json");
const swaggerUi = require("swagger-ui-express");
const redoc = require("redoc-express");
const db = require("./models");
const { scheduleMessage } = require("./app/helper/helpers");
const cron = require("node-cron");
const app = express();
const fileUpload = require("express-fileupload");
require("dotenv").config();
const port = process.env.PORT;
const cors = require("cors");
const expressWinston = require("express-winston");
const winston = require("winston");
const i18n = require("i18n");
const acceptLanguageParser = require("accept-language-parser");
const DailyRotateFile = require("winston-daily-rotate-file");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());
app.use(cors());
app.use(async (req, res, next) => {
  const languages = acceptLanguageParser.parse(req.headers["accept-language"]);

  const language = languages && languages.length ? languages[0].code : "en";
  console.log(language);
  // Set the locale for the request
  await i18n.configure({
    locales: ["en", "hi", "ass"],
    directory: __dirname + "/locales",
    defaultLocale: language,
  });

  next(); // Proceed to the next middleware
});
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

//Start logger code
// const requestLogger = expressWinston.logger({
//   transports: [
//     new winston.transports.Console(), // Log to the console for development
//     new DailyRotateFile({
//       filename: "logs/%DATE%/info.log",
//       datePattern: "YYYY-MM-DD",
//       zippedArchive: true,
//       maxSize: "20m",
//       maxFiles: "14d",
//       level: "info",
//     }),
//     new DailyRotateFile({
//       filename: "logs/%DATE%/error.log",
//       datePattern: "YYYY-MM-DD",
//       zippedArchive: true,
//       maxSize: "20m",
//       maxFiles: "14d",
//       level: "error",
//     }),
//     new DailyRotateFile({
//       filename: "logs/%DATE%/warn.log",
//       datePattern: "YYYY-MM-DD",
//       zippedArchive: true,
//       maxSize: "20m",
//       maxFiles: "14d",
//       level: "warn",
//     }),
//   ],
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   meta: true, // Disable logging metadata (such as response time)
//   msg: "HTTP {{req.method}} {{res.statusCode}} {{res.responseTime}}ms {{req.url}}",
//   expressFormat: true,
//   colorize: false,
//   // skip: skipLoggerForBaseURL, // Skip logging for base URL
// });

// // Attach the request logger middleware to all routes
// app.use(requestLogger);
//end logger code

// Configure i18n

require("./route/index")(app);
//app.use('/admin/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinitionOfAdmin));
app.use(
  "/app/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDefinitionOfApp)
);
app.use("/uploads", express.static("uploads"));

global.__basedir = __dirname;
let environment = process.env.NODE_ENV;
db.sequelize
  .authenticate()
  .then(function () {
    if (environment == "test" || environment == "development") {
      app.listen(port, () => {
        // cron.schedule("* * * * * *", function () {
        //   scheduleMessage();
        //   console.log("Cron is working");
        // });
        console.log(`Local/Development environment listening on port ${port}`);
      });
    } else if (environment == "production") {
      var privateKey = fs.readFileSync("./ssl/privkey.pem");
      var certificate = fs.readFileSync("./ssl/fullchain.pem");
      // var ca = fs.readFileSync('gd_bundle-g2-g1.crt');
      var credentials = {
        key: privateKey,
        cert: certificate,
        // ca: ca
      };
      var server = require("https").createServer(credentials, app);

      server.listen(port, () => {
        console.log(`Live environment listening on port ${port}`);
      });
    }
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
