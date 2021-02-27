const User = require("./models/user");
const { Action } = require("./models/action");
const Branch = require("./models/branch");
const { LensOutlined } = require("@material-ui/icons");

// operations for Branch
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
  const allBranches = await Branch.find({}).select("time name actions");
  return allBranches;
};

const deleteBranch = async (name) => {
  return Branch.deleteOne({ name });
};

const findBranch = async (name) => {
  return !((await Branch.findOne({ name })) === null);
};

const getCommitToPull = async (time, name) => {
  let newActions = await Branch.findOne({
    name,
    time: { $gte: time },
  }).select("actions");
  newActions = newActions.actions.reverse();
  const timeRecord = {};
  for (let i = 0; i < newActions.length; i += 1) {
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
    }
  }
  const updateData = newActions.filter((aciton, i) => {
    return Object.values(timeRecord).includes(i);
  });
  return updateData;
};

const initialize = async () => {
  let time;
  let x;
  const actions = [];

  for (let i = 0; i < 5; i += 1) {
    x = Math.random();
    time = 1000 * i;
    actions.push(
      Action({
        from: "Ken",
        type: "position",
        mode: "ADD",
        data: `{"Start": ${time}, "x": ${x}, "y": ${x}, "z": ${x}}`,
      })
    );
    actions.push(
      Action({
        from: "Ken",
        type: "position",
        mode: "EDIT",
        data: `{"Start": ${time}, "x": ${x + 1}, "y": ${x + 2}, "z": ${x + 3}}`,
      })
    );
  }

  for (let i = 0; i < 5; i += 1) {
    x = Math.random();
    time = 1000 * i;
    actions.push(
      Action({
        from: "Ken",
        type: "position",
        mode: "EDIT",
        data: `{"Start": ${time}, "x": ${x + 1}, "y": ${x + 2}, "z": ${x + 3}}`,
      })
    );
  }
  await deleteAllBranches();
  console.log(actions);
  await createBranch("main", actions);
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
  getCommitToPull,
  initialize,
  findUser,
  createUser,
};
