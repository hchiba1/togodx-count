#!/usr/bin/env node
const program = require('commander');
const fs = require('fs');
const syncRequest = require('sync-request');

program
  .option('-j, --json', 'show config in JSON')
  .option('-b, --branch <branch>', 'branch', 'develop')
  .option('-d, --debug', 'show URI and quit')
  .option('--js', 'use jsdelivr instead of raw.githubusercontent')
  .parse(process.argv);

const opts = program.opts();

let uri = `https://raw.githubusercontent.com/togodx/togodx-config-human/${opts.branch}/config/`;
if (opts.js) {
  uri = `https://cdn.jsdelivr.net/gh/dbcls/togosite@${opts.branch}/config/togosite-human/`;
}
uri += 'attributes.dx-server.json';

const datasets = ['chebi', 'chembl_compound', 'ensembl_gene', 'glytoucan', 'hp', 'mesh', 'mondo', 'nando', 'ncbigene', 'pdb', 'pubchem_compound', 'togovar', 'uniprot'];
let datasetIdMaps = [];
for (let i=0; i<datasets.length; i++) {
  datasetIdMaps[i] = new Map();
}

if (opts.debug) {
  console.log(uri);
} else {
  const json = syncRequest('GET', uri).getBody('utf8');
  if (opts.json) {
    process.stdout.write(json);
  } else {
    printAttributes(json);
  }
}

function printAttributes(json) {
  const obj = JSON.parse(json);
  obj.categories.forEach((category) => {
    console.log();
    console.log(`== ${category.label} ==`);
    category.attributes.forEach((attrId) => {
      const attr = obj.attributes[attrId];
      console.log();
      console.log(attr.datamodel);
      try {
        parseJson(attr.dataset, attrId);
      } catch (err) {
        console.error(`cannot parse ${attrId}`);
        process.exit(1);
      }
    });
  });
}

function parseJson(dataset, attrId) {
  // console.log(`= ${dataset}\t${attrId}`);

  let input;
  input = fs.readFileSync(attrId, "utf8");
  const obj = JSON.parse(input.toString());

  let rootId;
  let mapId = new Map();
  let mapLeaf = new Map();
  let mapParent = new Map();
  let mapCategory = new Map();
  let mapCategoryId = new Map();
  let isDAG = false;
  let countDAG = 0;
  let dagExample = '';
  let totalLeaves = 0;
  let totalIds = 0;

  obj.forEach((elem) => {
    if (!elem.id) {
      console.log(elem);
n    }
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
      saveDatasetId(dataset, elem.id);
      if (!mapLeaf.has(elem.id)) {
        mapLeaf.set(elem.id, true);
      }
      if (mapCategory.has(elem.parent)) {
        const count = mapCategory.get(elem.parent);
        mapCategory.set(elem.parent, count + 1);
      } else {
        mapCategory.set(elem.parent, 1);
      }
    } else if (elem.parent) {
      if (mapParent.has(elem.id)) {
        isDAG = true;
        countDAG++;
        dagExample = `${elem.id} (${elem.label})` + ' -> ' + mapParent.get(elem.id) + ', ' + elem.parent;
      } else {
        mapParent.set(elem.id, elem.parent)
      }
    }
    mapCategoryId.set(elem.id, elem.label);
  });

  if (mapLeaf.size) {
    console.log(`= ${mapLeaf.size} ${dataset}\t${attrId}`);
    process.stdout.write(`${totalLeaves} leaves`);
    if (mapLeaf.size === totalLeaves) {
      console.log(' (unique)');
    } else {
      process.stdout.write(`\n${mapLeaf.size} unique leaves\n`);
    }
    if (isDAG) {
      console.log(`DAG ${countDAG} ex. ${dagExample}`);
    }
    if (opts.verbose) {
      mapCategory.forEach((v, k) => {
        console.log(`${k} ${v}`, mapCategoryId.get(k));
      });
    }
  } else {
    console.log(`= ${mapId.size} ${dataset}\t${attrId}`);
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
}

console.log();
for (let i=0; i<datasets.length; i++) {
  console.log(datasets[i] + '\t' + datasetIdMaps[i].size);
}

function saveDatasetId(dataset, id) {
  const i = datasets.indexOf(dataset);
  datasetIdMaps[i].set(id, true);
  return;
}
