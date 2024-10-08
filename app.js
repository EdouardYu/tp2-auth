const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const dotenv = require("dotenv");

const User = require("./db/model/userModel");
const connectDB = require("./db/mongoose");

dotenv.config();
const app = express();

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, {
          message: "Incorrect username or password",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, {
          message: "Incorrect username or password",
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const dbName = process.env.DBNAME || "auth";
connectDB(dbName);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).json({ errors: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({});
    });
  })(req, res, next);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post(
  "/register",
  [
    body("username")
      .trim()
      .isAlphanumeric()
      .withMessage("Username must contain only letters and numbers"),
    body("email").isEmail().withMessage("Please enter a valid email address"),
    body("password").custom((value) => {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
      if (!strongPasswordRegex.test(value)) {
        throw new Error(
          "Password must be at least 12 characters long, contain uppercase, lowercase, numbers, and special characters"
        );
      }
      return true;
    }),
    body("passwordConfirm").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
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
      res.redirect("/login");
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/home", isAuthenticated, (req, res) => {
  const userInfo = {
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  };

  res.render("home", { user: userInfo });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

var port = process.env.PORT || 9000;
app.listen(port, function () {
  console.log("Server has started on port:", port);
});
