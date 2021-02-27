const express = require("express");
const asyncHandler = require("express-async-handler");

const db = require("../db");

const router = express.Router();

// Handle register post
router.route("/").post(
  express.urlencoded({ extended: false }),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await db.findUser(username);
    if ((await db.findUser(username)) !== null) {
      res.send("Username used");
    } else {
      await db.createUser(username, password);
      res.send("User created");
    }
    console.log(user);
    console.log(password);
  })
);

module.exports = router;
