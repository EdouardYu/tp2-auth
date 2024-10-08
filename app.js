// app.js
var express = require("express");
const path = require("path");
const { body, validationResult } = require("express-validator");

var app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

router.get("/", function (req, res) {
  res.render("index");
});

router.get("/register", function (req, res) {
  res.render("register");
});

app.post(
  "/register",
  [
    body("username")
      .trim()
      .isAlphanumeric()
      .withMessage("Username must contain only letters and numbers (back)"),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address (back)"),
    body("password").custom((value) => {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
      if (!strongPasswordRegex.test(value)) {
        throw new Error(
          "Password must be at least 12 characters long, contain uppercase, lowercase, numbers, and special characters (back)"
        );
      }
      return true;
    }),
    body("passwordConfirm").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match (back)");
      }
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const groupedErrors = errors
        .array()
        .map((error) => error.msg)
        .join("<br>");
      return res.status(400).json({ errors: groupedErrors });
    }

    // Inputs are valid, proceed to add the user to the database
    console.log(req.body);
    // Add user to the database (e.g., SQL insertion)

    res.status(200).json({});
  }
);

// Showing login form
router.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  console.log(req.body);

  // Authenticate user

  // If success redirect to home page
  // res.render('home');
});

app.use("/", router);

var port = process.env.PORT || 9000;

app.listen(port, function () {
  console.log("Server Has Started! port: ", port);
});
