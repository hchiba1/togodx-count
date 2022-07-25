#!/usr/bin/env node
const program = require('commander');
const fs = require('fs');

program
  .option('-v, --verbose', 'verbose')
  .arguments('[INPUT]')
  .parse(process.argv);

const opts = program.opts();

const targetDatasets = ['ncbigene', 'ensembl_gene', 'uniprot', 'pdb', 'chebi', 'chembl_compound', 'pubchem_compound', 'glytoucan', 'mondo', 'mesh', 'nando', 'hp', 'togovar'];

let out = {};
targetDatasets.forEach((source) => {
  out[source] = {};
});

(async () => {
  let input;
  if (program.args[0]) {
    try {
      input = fs.readFileSync(program.args[0], "utf8");
    } catch (err) {
      console.error(`cannot open ${program.args[0]}`);
      process.exit(1);
    }
  } else if (process.stdin.isTTY) {
    program.help();
    process.exit(1);
  } else {
    try {
      input = fs.readFileSync(process.stdin.fd).toString();
    } catch (err) {
      process.exit(1);
    }
  }
  let lines = input.trim().split('\n');
  lines.forEach((line) => {
    let datasets, source, target, count;
    [datasets, count] = line.split('\t');
    [source, target] = datasets.split('-');
    out[source][target] = count;
    if (out[target][source]) {
      console.error('already checked ${target}-${source}');
    }
    out[target][source] = count;
  });
  console.log(JSON.stringify(out, null, '  '));
})();
