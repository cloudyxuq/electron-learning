// const MongoClient = require("mongodb").MongoClient;
// MongoClient.connect("mongodb://127.0.0.1:27020/electron-server").then(
//   async (client) => {
//     const db = client.db("electron-server");
//     const col = db.collection("rules");
//     const rules = await col.find().toArray();
//     console.log(rules);
//   }
// );
console.log("111111111");
console.log(document);
const { ipcRenderer } = require("electron");
console.log("222222222");
const links = document.querySelectorAll("a[href]");
// console.log("links", links);
links.forEach((link) => {
  link.addEventListener("click", (e) => {
    const url = link.getAttribute("href");
    e.preventDefault();
    // console.log("renderurl", url);
    ipcRenderer.send("open-url", url);
  });
});
