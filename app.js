const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const dotenv = require("dotenv");

const User = require("./db/model/userModel");
const connectDB = require("./db/mongoose");

dotenv.config();

var app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

const dbName = process.env.DBNAME || "auth";
connectDB(dbName);

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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const groupedErrors = errors
        .array()
        .map((error) => error.msg)
        .join("<br>");
      return res.status(400).json({ errors: groupedErrors });
    }
    console.log(req.body);

    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.status(400).json({
          errors:
            existingUser.username === username
              ? "Username is already taken"
              : "Email is already in use",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: "user",
      });

      await user.save();


    }
);

router.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  console.log(req.body);

  // Authenticate user

  // If success redirect to home page
  // res.render('home');
});

router.get(
  "/callback",
  passport.authenticate("auth0", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);


app.use("/", router);

var port = process.env.PORT || 9000;

app.listen(port, function () {
  console.log("Server Has Started! port: ", port);
});
