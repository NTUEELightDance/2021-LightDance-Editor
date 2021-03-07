/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable global-require */
const express = require("express");
const path = require("path");
const Websocket = require("ws");
const http = require("http");
const bodyParser = require("body-parser");

const { COMMANDS } = require("../constant");
const DancerSocket = require("./websocket/DancerSocket");
const EditorSocket = require("./websocket/editorSocket");
const board_config = require("./board_config.json");

// const router = express.Router();
const app = express();
const server = http.createServer(app);
const wss = new Websocket.Server({ server });

const dancerClients = {};
const editorClients = {};

const socketReceiveData = (from, msg) => {
  const { type, task, payload } = msg;
  console.log("Type: ", type, ", task: ", task, ", payload: ", payload);
  switch (type) {
    case "dancer": {
      Object.values(editorClients).forEach((editor) => {
        editor.sendDataToClientEditor([
          task,
          {
            from,
            response: payload,
          },
        ]);
      });
      break;
    }
    case "Editor": {
      break;
    }
    default:
      break;
  }
};
const DancerSocketAgent = {
  addDancerClient: (dancerName, dancerSocket) => {
    dancerClients[dancerName] = dancerSocket;
  },
  deleteDancerClient: (dancerName) => {
    delete dancerClients[dancerName];
  },
  socketReceiveData,
};
const EditorSocketAgent = {
  addEditorClient: (editorName, editorSocket) => {
    editorClients[editorName] = editorSocket;
  },
  deleteEditorClient: (editorName) => {
    delete editorClients[editorName];
  },
  socketReceiveData,
};

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config();
  const webpack = require("webpack");
  const { merge } = require("webpack-merge");
  const commonConfig = require("../../config/webpack.common.js");
  const envConfig = require("../../config/webpack.dev.js");
  const webpackConfig = merge(commonConfig, envConfig);
  const compiler = webpack(webpackConfig);

  app.use(
    require("webpack-dev-middleware")(compiler, {
      publicPath: webpackConfig.output.publicPath,
    })
  );
  app.use(
    require("webpack-hot-middleware")(compiler, {
      log: false,
      path: "/__hmr",
      heartbeat: 2000,
    })
  );
} else {
  const buildPath = path.resolve(__dirname, "..", "..", "./build");
  app.use(express.static(buildPath));
}

wss.on("connection", (ws) => {
  ws.onmessage = (msg) => {
    const [task, payload] = JSON.parse(msg.data);
    console.log("Client response: ", task, "\nPayload: ", payload);

    if (task === "boardInfo") {
      const hostName = payload.name;
      if (true) {
        // TODO import board_config to check dancer's name
        let dancerName = "";
        if (board_config[hostName] !== undefined)
          dancerName = board_config[hostName].dancerName;
        // get dancerName from hostname
        // const dancerName = "test_dancer"; // test

        // ask about dancerClient
        const dancerSocket = new DancerSocket(
          ws,
          dancerName,
          DancerSocketAgent
        );
        dancerSocket.handleMessage();
      }
    } else if (task === "editor") {
      const editorName = "test_editor"; // test

      const editorSocket = new EditorSocket(ws, editorName, EditorSocketAgent);
      editorSocket.handleMessage();
    }
  };
});

const assetPath = path.resolve(__dirname, "..", "..", "./asset");
app.use("/asset", express.static(assetPath));
const dataPath = path.resolve(__dirname, "..", "..", "./data");
app.use("/data", express.static(dataPath));

app.use(bodyParser.json());

COMMANDS.forEach((command) => {
  app.post(`/api/${command}`, (req, res) => {
    console.log(command); // for test
    console.log(req.body);
    const { selectedDancers } = req.body;
    switch (command) {
      case "play": {
        const { startTime, whenToPlay } = req.body;
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].play(startTime, whenToPlay);
        });
        break;
      }
      case "uploadControl": {
        const { controlJson } = req.body;
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].uploadControl(controlJson);
        });
        break;
      }
      case "uploadLed": {
        const { ledData } = req.body;
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].uploadLED(ledData);
        });
        break;
      }
      case "lightCurrentStatus": {
        const { lightCurrentStatus } = req.body;
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].lightCurrentStatus(lightCurrentStatus);
        });
        break;
      }
      case "sync": {
        selectedDancers.forEach((dancerName) => {
          // TODO
        });
        break;
      }
      case "start": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].start();
        });
        break;
      }
      case "load": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].load();
        });
        break;
      }
      case "pause": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].pause();
        });
        break;
      }
      case "stop": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].stop();
        });
        break;
      }
      case "terminate": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].terminate();
        });
        break;
      }
      case "kick": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].kick();
        });
        break;
      }
      case "shutdown": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].shutdown();
        });
        break;
      }
      case "reboot": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].reboot();
        });
        break;
      }
      case "kill": {
        selectedDancers.forEach((dancerName) => {
          dancerClients[dancerName].kill();
        });
        break;
      }
      default: {
        break;
      }
    }
    res.send(command);
  });
});

const port = 8080;

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
