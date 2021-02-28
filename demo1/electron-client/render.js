const { ipcRenderer } = require("electron");
const _ = require("lodash");

const addButton = document.body
  .getElementsByClassName("avue-crud__left")[0]
  .getElementsByTagName("button")[0];

addButton.click();

setTimeout(() => {
  const result = ipcRenderer.sendSync("filldata", "");
  // console.log(result);
  const inputs = document.getElementsByClassName("el-input__inner");
  _.each(inputs, (e) => {
    if (e.getAttribute("placeholder") === "请输入 用户名") {
      console.log("username dom found");
      e.focus();
      e.setAttribute("value", "testusername");
    }
  });

  const btns = document.getElementsByClassName(
    "el-button el-button--primary el-button--small"
  );
  _.each(btns, (btn) => {
    if (btn.innerText === "保 存") {
      console.log(btn);
      btn.click();
    }
  });
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
