const express = require("express");

const router = express.Router();

// Handle login post
router.route("/").post(express.urlencoded({ extended: false }), (req, res) => {
  const { branchName, from, type, mode, data } = req.body;
  const wss = req.app.get("wss");
  wss.handleSync(JSON.stringify(req.body));
  console.log(type, mode, data);
  res.send("sync");
});

module.exports = router;
