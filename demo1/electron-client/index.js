const MongoClient = require("mongodb").MongoClient;
const { app, BrowserWindow, ipcMain, session } = require("electron");
const _ = require("lodash");
let mongoClient = null;
const path = require("path");
const fs = require("fs");

let RULES = [];
const centent = fs.readFileSync(path.join(__dirname, "render.js"));

function dataHandler(funcDefinition, data, identifier) {
  let func = new Function("source", funcDefinition);
  let arr = func(data);
  if (arr.length > 0) {
    const col = mongoClient.db("electron-server").collection("contents");
    for (let e of arr) {
      col.update(
        { identifier: e[identifier] },
        { $set: { source: JSON.stringify(e, null, 4), status: "NEW" } },
        { upsert: true }
      );
    }
  }
  // console.log(arr);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      // preload: path.join(__dirname, "preload.js"),
    },
  });

  //require('electron').ipcRenderer.send('gpu', document.body.innerHTML);

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // console.log("details", details);
    // for (let rule of RULES) {
    //   if (details.url.indexOf(rule.source.urlPattern) > -1) {
    //     win.webContents.executeJavaScript(centent);
    //     console.log(details, rule, win.webContents);
    //   }
    // }

    callback({ cancel: false });
  });

  try {
    win.webContents.debugger.attach("1.3");
  } catch (err) {
    console.log("Debugger attach failed : ", err);
  }

  win.webContents.debugger.on("detach", (event, reason) => {
    console.log("Debugger detached due to : ", reason);
  });
  //"https://vue.ruoyi.vip/prod-api/monitor/operlog/list"
  win.webContents.debugger.on("message", (event, method, params) => {
    //https://chromedevtools.github.io/devtools-protocol/tot/DOM

    if (method === "Network.responseReceived") {
      for (let rule of RULES) {
        if (params.response.url.indexOf(rule.source.urlPattern) > -1) {
          console.log(
            `Event: responseReceived requestId=${params.requestId} url=${
              params.response.url
            } header=${JSON.stringify(params.response.headers)}`
          );

          win.webContents.debugger
            .sendCommand("Network.getResponseBody", {
              requestId: params.requestId,
            })
            .then((res) => {
              if (
                params.response.headers["Content-Type"] === "application/json"
              ) {
                let obj = JSON.parse(res["body"]);
                dataHandler(rule.source.handler, obj, rule.source.identifier);
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

    // if (method === "Network.webSocketFrameReceived") {
    //   console.log(params.response);
    // }
    // if (method === "Network.requestWillBeSent") {
    //   if (params.request.url === "https://www.github.com") {
    //     win.webContents.debugger.detach();
    //   }
    // }
  });

  win.webContents.debugger.sendCommand("Network.enable");

  // win.webContents.debugger.on("message", (event, method, params) => {
  //   console.log(event, method, params);
  //   if (method === "Network.responseReceived") {
  //     // if (params.response.url.indexOf("xxxxx") > 0) {
  //     console.log(
  //       "Event: responseReceived " +
  //         params.requestId +
  //         "-" +
  //         params.response.url
  //     );
  //     win.webContents.debugger.sendCommand(
  //       "Network.getResponseBody",
  //       { requestId: params.requestId },
  //       (error, result) => {
  //         if (!error || JSON.stringify(error) == "{}") {
  //           console.log(`getResponseBody result: ${JSON.stringify(result)}`);
  //         } else {
  //           console.log(`getResponseBody error: ${JSON.stringify(error)}`);
  //         }
  //       }
  //     );
  //     // }
  //   }

  //   if (method === "Network.webSocketFrameReceived") {
  //     console.log(params.response);
  //   }
  // });

  // win.webContents.on("dom-ready", (a, b) => {
  // console.log(win.webContents._getURL());
  // const centent = fs.readFileSync(path.join(__dirname, "render.js"));
  // win.webContents.executeJavaScript(centent);
  // win.webContents.executeJavaScript(`
  //   const target  = document.querySelector(".head-news-title");
  //   const attrs = target.attributes;
  //   const map = {}
  //   for(const attr of attrs){
  //     map[attr.name] = attr.value;
  //   }
  //   require('electron').ipcRenderer.send('gpu', JSON.stringify(map));
  //   target.style.color = "red";
  // `);
  // });

  // ipcMain.on("gpu", (_, gpu) => {
  //   console.log("gpu", gpu);
  // });

  // ipcMain.on("open-url", (_, url) => {
  //   console.log("url", url);
  //   win.loadURL(url);
  // });

  //win.loadURL("https://vue.ruoyi.vip/");
  win.loadURL("https://pigx.pig4cloud.com");
  win.webContents.openDevTools();

  //事件列表 https://www.electronjs.org/docs/api/web-contents#%E4%BA%8B%E4%BB%B6-responsive
  win.webContents.on(
    "did-navigate-in-page",
    (event, url, isMainFrame, frameProcessId, frameRoutingId) => {
      // console.log(event, url, isMainFrame, frameProcessId, frameRoutingId);
      // console.log("did-navigate-in-page", url);
      if (url === "https://pigx.pig4cloud.com/#/admin/user/index") {
        console.log("send message to render ");
        win.webContents.executeJavaScript(centent);
      }
    }
  );

  win.webContents.on("before-input-event", (event) => {
    console.log("before-input-event");
  });

  win.webContents.on("did-frame-navigate", (event) => {
    console.log("did-frame-navigate");
  });
}

app.whenReady().then(() => {
  createWindow();
  return;
  //TODO above is test code
  MongoClient.connect("mongodb://127.0.0.1:27020/electron-server").then(
    async (client) => {
      mongoClient = client;
      //load config from db
      try {
        const db = client.db("electron-server");
        const col = db.collection("rules");
        const rules = await col.find().toArray();
        RULES = _.cloneDeep(rules);
        console.log(`load rule size : ${RULES.length}`);
      } catch (e) {
        console.error(e.message);
      }
      createWindow();
    }
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
