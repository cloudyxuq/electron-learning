const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const MongoClient = require("mongodb").MongoClient;
const config = require("./config");
let mongoClient = null;

let RULES = [];
const centent = fs.readFileSync(path.join(__dirname, "render.js"));

let win = null;

app.on("ready", () => {
  createWindow();
  initDB();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    width: 1200,
    height: 800,
    minHeight: 340,
    minWidth: 680,
  });

  win.on("closed", () => {
    win = null;
  });

  //chrome开发者工具
  win.webContents.openDevTools();

  ipcMain.on("filldata", (event, arg) => {
    const db = mongoClient.db("electron-server");
    const col = db.collection("contents");
    const ruleCol = db.collection("rules");
    col.findOne((err, doc) => {
      if (err) {
        console.error(err.message);
      }
      ruleCol.findOne({ _id: doc.rule }, (err, pdoc) => {
        event.returnValue = JSON.stringify({
          content: doc,
          rule: pdoc,
        });
      });
    });
  });

  addSourceListener(win);

  addDestListener(win);

  const template = [
    {
      label: "应用",
      submenu: [
        {
          label: "这是一个demo",
          click: function () {
            dialog.showMessageBox({
              type: "info",
              message: "这是一个demo程序，仅用于演示",
            });
          },
        },
        { type: "separator" },
        {
          label: "退出",
          click: function () {
            app.quit();
          },
        },
      ],
    },
    {
      label: "操作",
      submenu: [
        {
          label: "源网站",
          click: function () {
            win.loadURL(config.sourceUrl);
          },
        },
        { type: "separator" },
        {
          label: "目标网站",
          click: function () {
            win.loadURL(config.destUrl);
          },
        },
        { type: "separator" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function addSourceListener(win) {
  try {
    win.webContents.debugger.attach("1.3");
  } catch (err) {
    console.log("Debugger attach failed : ", err);
  }

  win.webContents.debugger.on("detach", (event, reason) => {
    console.log("Debugger detached due to : ", reason);
  });
  // https://vue.ruoyi.vip/prod-api/monitor/operlog/list
  // https://chromedevtools.github.io/devtools-protocol/tot/DOM
  win.webContents.debugger.on("message", (event, method, params) => {
    if (method === "Network.responseReceived") {
      for (let rule of RULES) {
        if (params.response.url.indexOf(rule.source.urlPattern) > -1) {
          //匹配采集规则成功
          console.log(
            `Event: responseReceived requestId=${params.requestId} url=${
              params.response.url
            } header=${JSON.stringify(params.response.headers)}`
          );

          win.webContents.debugger
            .sendCommand("Network.getResponseBody", {
              requestId: params.requestId,
            })
            .then(async (res) => {
              if (
                params.response.headers["Content-Type"] === "application/json"
              ) {
                await saveData(
                  rule.source.handler,
                  JSON.parse(res["body"]),
                  rule.source.identifier,
                  rule._id
                );
                //弹出采集成功的确认框
                dialog.showMessageBox({
                  type: "info",
                  message: `恭喜！数据采集成功`,
                });
              }
            });
        }
      }
    }

    if (method === "Target.targetCreated") {
      console.log("Target.targetCreated");
    }

    if (method === "DOM.documentUpdated") {
      console.log("DOM.documentUpdated");
    }
  });

  win.webContents.debugger.sendCommand("Network.enable");
}

function addDestListener(win) {
  win.webContents.on(
    "did-navigate-in-page",
    (event, url, isMainFrame, frameProcessId, frameRoutingId) => {
      //url example: "https://pigx.pig4cloud.com/#/admin/user/index"
      const arr = _.filter(RULES, { destination: { urlPattern: url } });
      _.each(arr, () => {
        console.log("send message to render ");
        win.webContents.executeJavaScript(centent);
      });
    }
  );
}

//保存采集的数据，暂时只支持json
async function saveData(funcDefinition, data, identifier, ruleId) {
  let func = new Function("source", funcDefinition);
  let arr = func(data);
  if (arr.length > 0) {
    const col = mongoClient.db("electron-server").collection("contents");
    for (let e of arr) {
      await col.update(
        { identifier: e[identifier] },
        {
          $set: {
            source: JSON.stringify(e, null, 4),
            status: "NEW",
            rule: ruleId,
          },
        },
        { upsert: true }
      );
    }
  }
}

function initDB() {
  MongoClient.connect(config.mongoUrl)
    .then((client) => {
      mongoClient = client;
      loadRulesFromDB();
    })
    .catch(() => {
      dialog.showMessageBox({
        type: "error",
        message: "数据库连接失败，后续操作将无法进行，请检查",
      });
    });
}

async function loadRulesFromDB() {
  const db = mongoClient.db("electron-server");
  const col = db.collection("rules");
  const rules = await col.find().toArray();
  RULES = _.cloneDeep(rules);
  dialog.showMessageBox({
    type: "info",
    message: `成功加载${RULES.length}条规则`,
  });
}
