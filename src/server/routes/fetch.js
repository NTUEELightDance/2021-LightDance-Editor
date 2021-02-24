const express = require("express");

const Branch = require("../models/branch");

const router = express.Router();

const commitToPull = (time, branch) => {
  Branch.find({ branch, time: { $gte: Date.now() } }).then((response) => {
    console.log(response);
    console.log(Date.now());
  });
};

// Handle login post

router.route("/").get((req, res) => {
  const { time, branch } = req.query;
  console.log({ time, branch });
  commitToPull();
  res.send({ time, branch });
});

module.exports = router;
