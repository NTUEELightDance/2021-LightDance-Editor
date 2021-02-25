const express = require("express");
const asyncHandler = require("express-async-handler");

const User = require("../models/user");

const router = express.Router();

const findUser = async (username) => {
  return User.findOne({ username }).select("username password");
};

const createUser = async (username, password) => {
  const newUser = User({ username, password });
  await newUser.save();
  return "User created";
};

// Handle register post
router.route("/").post(
  express.urlencoded({ extended: false }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await findUser(username);
    if ((await findUser(username)) !== null) {
      res.send("Username used");
    } else {
      await createUser(username, password);
      res.send("User created");
    }
    console.log(user);
    console.log(password);
  })
);

module.exports = router;
