#!/usr/bin/env node
const program = require('commander');
const fs = require('fs').promises;

program
  .arguments('[INPUT]')
  .parse(process.argv);

let count = {};
let categories = [];
let root_count = 0;
let leaves = 0;
let checkLeaf = new Map();

(async () => {
  let input;
  try {
    input = await fs.readFile(program.args[0], "utf8");
  } catch (err) {
    console.error(`cannot open ${program.args[0]}`);
    process.exit(1);
  }
  input = input.toString();
  const obj = JSON.parse(input);
  obj.forEach((elem) => {
    if (!elem.id) {
      console.log(elem);
    }
    if (!elem.label) {
      // console.log(elem);
    }
    if (elem.root === true) {
      root_count += 1;
      if (elem.label === 'root node') {
        // console.log('root');
      } else {
        // console.log(elem);
      }
    } else if (elem.root) {
      // console.log(elem);
    } else if (elem.parent) {
      if (elem.leaf === true) {
        leaves += 1;
        if (checkLeaf.has(elem.id)) {
        } else {
          checkLeaf.set(elem.id, true);
        }
      }
      if (count[elem.parent]) {
        count[elem.parent] = count[elem.parent] + 1;
      } else {
        count[elem.parent] = 1;
      }
    } else {
      // console.log(elem);
    }
    // } else if (elem.leaf === true) {
      // if (elem.parent) {
      //   const category = elem.parent;
      //   if (count[category]) {
      //     count[category] = count[category] + 1;
      //   } else {
      //     count[category] = 1;
      //   }
      // } else {
      //   console.log(elem);
      // }
    //   leaves ++;
    // } else {
      // categories.push(elem.id);
    // }
  });

  // let total = 0;
  // categories.forEach((cat) => {
  //   if (count[cat]) {
  //     total += count[cat];
  //   } else {
      // console.log('cannot find', cat);
  //   }
  // });

  if (root_count != 1) {
    // process.stdout.write(String(root_count) + ' root ');
  }
  // console.log(Object.keys(count).length, 'categories', leaves, 'leaves', checkLeaf.size);
  console.log(checkLeaf.size);
})();
