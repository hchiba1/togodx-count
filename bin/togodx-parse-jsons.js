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
      try {
        parseJson(attr.dataset, attrId, attr);
      } catch (err) {
        console.error(`cannot parse ${attrId}`);
        process.exit(1);
      }
    });
  });
}

function parseJson(dataset, attrId, attr) {
  let input;
  input = fs.readFileSync(attrId, "utf8");
  const obj = JSON.parse(input.toString());

  let rootId;
  let uniqIds = new Map();
  let mapParent = new Map();
  let isDAG = false;
  let countDAG = 0;
  let dagExample = '';
  let totalCount = 0;

  obj.forEach((elem) => {
    if (!elem.id) {
      console.error(elem);
    }

    if (attr.datamodel === 'distribution') {
      totalCount++;
      uniqIds.set(elem.id, true);
      saveDatasetId(dataset, elem.id);
    } else {
      if (elem.root) {
        checkRoot(elem);
      } else if (elem.leaf === true) {
        totalCount++;
        uniqIds.set(elem.id, true);
        saveDatasetId(dataset, elem.id);
      } else if (elem.parent) {
        if (mapParent.has(elem.id)) {
          isDAG = true;
          countDAG++;
          dagExample = `${elem.id} (${elem.label})` + ' -> ' + mapParent.get(elem.id) + ', ' + elem.parent;
        } else {
          mapParent.set(elem.id, elem.parent)
        }
      }
    }
  });

  console.log(`# ${uniqIds.size}\t${dataset}\t${attrId}\t${attr.datamodel}`);
  if (uniqIds.size !== totalCount) {
    console.log(`${totalCount} ids`);
  }
  if (isDAG) {
    console.log(`DAG ${countDAG} ex. ${dagExample}`);
  }

  function checkRoot (elem) {
    if (elem.root === true) {
      if (rootId) {
        console.error('error: rootId=', rootId);
      }
      rootId = elem.id;
    } else {
      console.error('error: root is', elem);
    }
  }
}

for (let i=0; i<datasets.length; i++) {
  for (let key of datasetIdMaps[i].keys()) {
    console.error(`${datasets[i]}\t${key}`);
  }
}

function saveDatasetId(dataset, id) {
  const i = datasets.indexOf(dataset);
  datasetIdMaps[i].set(id, true);
  return;
}
