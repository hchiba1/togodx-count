#!/usr/bin/env node
const program = require('commander');
const fs = require('fs').promises;

program
  .arguments('[INPUT]')
  .parse(process.argv);

let rootId;
let mapId = new Map();
let mapLeaf = new Map();
let mapParent = new Map();
let isDAG = false;
let countDAG = 0;
let dagExample = '';
let totalLeaves = 0;
let totalIds = 0;

(async () => {
  let input;
  try {
    input = await fs.readFile(program.args[0], "utf8");
  } catch (err) {
    console.error(`cannot open ${program.args[0]}`);
    process.exit(1);
  }
  const obj = JSON.parse(input.toString());
  obj.forEach((elem) => {
    if (!elem.id) {
      console.log(elem);
    }
    if (!mapId.has(elem.id)) {
      mapId.set(elem.id, true);
    }
    totalIds++;
    // if (!elem.label) {
    //   console.log(elem);
    // }

    if (elem.root) {
      if (elem.root === true) {
        if (rootId) {
          console.log('error: rootId=', rootId);
        }
        rootId = elem.id;
      } else {
        console.log('error: root is', elem);
      }
    } else if (elem.leaf === true) {
      totalLeaves += 1;
      if (!mapLeaf.has(elem.id)) {
        mapLeaf.set(elem.id, true);
      }
    } else {
      if (mapParent.has(elem.id)) {
        isDAG = true;
        countDAG++;
        dagExample = `${elem.id} (${elem.label})` + ' -> ' + mapParent.get(elem.id) + ', ' + elem.parent;
      } else {
        mapParent.set(elem.id, elem.parent)
      }
    }
  });

  if (mapLeaf.size) {
    process.stdout.write(`${totalLeaves} leaves`);
    if (mapLeaf.size === totalLeaves) {
      console.log(' (unique)');
    } else {
      process.stdout.write(`\n${mapLeaf.size} unique leaves\n`);
    }
    if (isDAG) {
      console.log(`DAG ${countDAG} ex. ${dagExample}`);
    }
  } else {
    process.stdout.write(`${totalIds} ids`);
    if (mapId.size === totalIds) {
      console.log(' (unique)');
    } else {
      process.stdout.write(`\n${mapId.size} unique ids\n`);
    }
    if (isDAG) {
      console.log(`duplicated ${countDAG} ex. ${dagExample}`);
    }
  }
})();
