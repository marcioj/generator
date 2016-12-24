#!/usr/bin/env node

import Generator from './generator';
import { kebabCase, camelCase } from 'lodash';

let root = process.cwd();
let argv = require('minimist')(process.argv.slice(2));
let commandName = argv._[0];
let generatorName = argv._[1];
delete argv._;

process.on('uncaughtException', (err) => {
  console.log(err.message);
  process.exit(1);
});

let generators = Generator.load(root);

if (commandName && generatorName) {
  let params = camelCaseKeys(argv);
  let generator = findGenerator(generatorName);
  validateOptions(generator, params);

  switch (commandName) {
    case 'generate':
    case 'g':
      generator.create({ target: root, params });
      break;
    case 'destroy':
    case 'd':
      generator.destroy({ target: root, params });
      break;
    default:
      showHelp();
      process.exit(1);
      break;
  }
} else {
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log(`Usage: paranaue <command> <generator>

Available commands:

  create  Generates a scaffold
  destroy Destroy a generated scaffold

Available generators:

  ${generators.map(showGeneratorInfo)}
`);
}

function showGeneratorInfo(generator: Generator): string {
  return generator.name + ' ' + generator.getDescription() + '\n\n' +
    '  Options\n\n' +
    generateCliOptions(generator.getVariableNames()).map((flag) => '  ' + flag).join('\n');
}

function findGenerator(generatorName: string): Generator {
  let generator = generators.find(({ name }) => name === generatorName);
  if (!generator) {
    throw new Error(`Unable to find generator ${generatorName}`);
  }
  return generator
}

function validateOptions(generator: Generator, params) {
  let requiredOptions = [];
  generator.getRequiredVariableNames().forEach((varName) => {
    if (!(varName in params)) {
      requiredOptions.push(varName);
    }
  });

  if (requiredOptions.length) {
    throw new Error(`Missing required options ${generateCliOptions(requiredOptions).join(', ')}`);
  }
}

function generateCliOptions(variables: string[]): string[] {
  return variables.map((name) => '--' + kebabCase(name));
}

function camelCaseKeys(obj) {
  let newObj = {};
  for (let key in obj) {
    newObj[camelCase(key)] = obj[key];
  }
  return newObj;
}
