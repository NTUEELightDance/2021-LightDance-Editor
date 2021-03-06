const User = require("./models/user");
const { Action } = require("./models/action");
const Branch = require("./models/branch");

// operations for Branch
const createBranch = async (name, actions = []) => {
  const newBranch = Branch({ name, actions });
  return newBranch.save();
};

const deleteAllBranches = async () => {
  return Branch.deleteMany({});
};

const findAllBranches = async () => {
  const allBranches = await Branch.find({}).select("time name actions");
  return allBranches;
};

const deleteBranch = async (name) => {
  return Branch.deleteOne({ name });
};

const findBranch = async (name) => {
  return !((await Branch.findOne({ name })) === null);
};

const addActionToBranch = async (branchName, time, from, type, mode, data) => {
  const newAction = Action({
    time,
    from,
    type,
    mode,
    data: JSON.stringify(data),
  });
  const branch = await Branch.findOne({ name: branchName });
  branch.actions.push(newAction);
  return branch.save();
};

const getCommitToPull = async (time, name) => {
  console.log("request");
  let newActions = await Branch.findOne({
    name,
    time: { $gte: time },
  }).select("actions");
  newActions = newActions.actions;
  const timeRecord = {};
  for (let i = newActions.length - 1; i >= 0; i -= 1) {
    const action = newActions[i];
    const parsedData = JSON.parse(action.data);
    const curTime = parsedData.Start;
    if (timeRecord[curTime] === undefined) {
      timeRecord[curTime] = i;
    } else if (
      action.mode === "ADD" &&
      newActions[timeRecord[curTime]].mode === "DEL"
    ) {
      timeRecord[curTime] = -1;
    } else if (
      action.mode === "ADD" &&
      newActions[timeRecord[curTime]].mode === "EDIT"
    ) {
      newActions[timeRecord[curTime]].mode = "ADD";
    }
  }
  const updateData = newActions.filter((aciton, i) => {
    return Object.values(timeRecord).includes(i);
  });

  return updateData;
};

const initialize = async () => {
  const actions = [];
  await deleteAllBranches();
  await createBranch("main", actions);
  // console.log(actions);
};

// Operations for User
const findUser = async (username) => {
  return User.findOne({ username }).select("username password");
};

const createUser = async (username, password) => {
  const newUser = User({ username, password });
  await newUser.save();
  return "User created";
};

module.exports = {
  createBranch,
  deleteAllBranches,
  deleteBranch,
  findAllBranches,
  findBranch,
  addActionToBranch,
  getCommitToPull,
  initialize,
  findUser,
  createUser,
};
