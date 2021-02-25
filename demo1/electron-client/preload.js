const fs = require("fs");
const path = require("path");

//DOMContentLoaded
window.addEventListener("load", () => {
  //   const replaceText = (selector, text) => {
  //     const element = document.getElementById(selector);
  //     if (element) element.innerText = text;
  //   };

  //   for (const type of ["chrome", "node", "electron"]) {
  //     replaceText(`${type}-version`, process.versions[type]);
  //   }

  // const centent = fs.readFileSync(path.join(__dirname, "render.js"));

  // const x = document.getElementsByTagName("head");
  // x[0].innerHTML =
  //   `<script type="text/javascript">${centent}</script>` + x[0].innerHTML;
  console.log(window.location);
});
