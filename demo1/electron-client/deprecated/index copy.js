const MongoClient = require("mongodb").MongoClient;
const { app, BrowserWindow, ipcMain, session } = require("electron");
// const path = require("path");
// const fs = require("fs");

let RULES = [];
// const centent = fs.readFileSync(path.join(__dirname, "render.js"));

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
    if (method === "Network.responseReceived") {
      // console.log(typeof params.response.url);
      if (
        params.response.url.indexOf(
          "https://vue.ruoyi.vip/prod-api/monitor/operlog/list"
        ) >= 0
      ) {
        console.log(
          "Event: responseReceived " +
            params.requestId +
            "-" +
            params.response.url +
            "-" +
            JSON.stringify(params.response.header)
        );
        // console.log(params);
        win.webContents.debugger
          .sendCommand(
            "Network.getResponseBody",
            { requestId: params.requestId }
            // (error, result) => {
            //   console.log(error, result);
            // if (!error || JSON.stringify(error) == "{}") {
            //   console.log(`getResponseBody result: ${JSON.stringify(result)}`);
            // } else {
            //   console.log(`getResponseBody error: ${JSON.stringify(error)}`);
            // }
            // }
          )
          .then((res) => {
            let obj = JSON.parse(res["body"]);
            console.log(obj);
          });
      }
    }

    if (method === "Network.webSocketFrameReceived") {
      console.log(params.response);
    }
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

  win.webContents.on("dom-ready", (a, b) => {
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
  });

  // ipcMain.on("gpu", (_, gpu) => {
  //   console.log("gpu", gpu);
  // });

  ipcMain.on("open-url", (_, url) => {
    console.log("url", url);
    win.loadURL(url);
  });

  win.loadURL("https://vue.ruoyi.vip/");

  // win.loadURL("http://www.163.com");
  // win.loadURL("http://www.baidu.com");
  // win.loadURL("http://oschina.net");
  win.webContents.openDevTools();
  // win.loadURL("http://github.com");
  // const contents = win.webContents;
  // console.log(contents);
}

app.whenReady().then(() => {
  MongoClient.connect("mongodb://127.0.0.1:27020/electron-server").then(
    async (client) => {
      const db = client.db("electron-server");
      const col = db.collection("rules");
      const rules = await col.find().toArray();
      RULES = rules;
      // console.log(rules);
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
