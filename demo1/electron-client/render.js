const { ipcRenderer } = require("electron");
const _ = require("lodash");

const addButton = document.body
  .getElementsByClassName("avue-crud__left")[0]
  .getElementsByTagName("button")[0];

addButton.click();

setTimeout(() => {
  const result = ipcRenderer.sendSync("filldata", "");
  const obj = JSON.parse(result);
  console.log("obj", obj);

  const handler = new Function("data", obj.rule.destination.handler);
  handler(obj.content);

}, 1000);

/*
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
*/
