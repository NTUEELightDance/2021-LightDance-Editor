const express = require("express");
const asyncHandler = require("express-async-handler");

const Branch = require("../models/branch");

const router = express.Router();

const createBranch = async (name, actions = []) => {
  const newBranch = Branch({ name, actions });
  newBranch.save((err) => {
    if (err) console.log(err);
    // saved!
  });
};

const deleteAllBranches = async () => {
  return Branch.deleteMany({});
};

const findAllBranches = async () => {
  const allBranches = await Branch.find({}).select("time name");
  return allBranches;
};

const deleteBranch = async (name) => {
  return Branch.deleteOne({ name });
};

const findBranch = async (name) => {
  return !((await Branch.findOne({ name })) === null);
};

const initialize = async () => {
  await deleteAllBranches();
  await createBranch("main");
};

initialize();

// Handle login post
router
  .route("/")
  .get(
    asyncHandler(async (req, res) => {
      res.send(await findAllBranches());
    })
  )
  .post(
    express.urlencoded({ extended: false }),
    asyncHandler(async (req, res) => {
      const { name } = req.body;

      if (!(await findBranch(name))) {
        await createBranch(name);
        res.send(`branch: ${name} created`);
      } else {
        res.send(`branch: ${name} exists`);
      }
    })
  )
  .delete(
    express.urlencoded({ extended: false }),
    asyncHandler(async (req, res) => {
      const { name } = req.body;

      if (name === "All") {
        await deleteAllBranches();
        res.send("deleteAllBranches");
      } else if (!(await findBranch(name))) {
        res.send("Branch Not Found");
      } else {
        await deleteBranch(name);
        res.send(`delete branch: ${name}`);
      }
    })
  );

module.exports = router;
