const User = require("../db/model/userModel");
const { roles } = require("./roles");

exports.allowIfLoggedin = (req, res, next) => {
  console.log(req.user);
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "You need to be logged in to access this resource",
    });
  }
  next();
};

exports.grantAccess = function (action, resource) {
  return (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
        return res.status(403).json({
          error: "You don't have enough permission to perform this action",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.render("usersResult", { users });
  } catch (error) {
    next(error);
  }
};
