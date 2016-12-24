import { readdirSync, statSync, existsSync } from 'fs';
import { basename, join } from 'path';
let walkSync = require('walk-sync');
import File from './file';

interface RunOptions {
  target: string,
  params: any
}

export default class Generator {
  rootPath: string
  name: string
  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.name = basename(this.rootPath);
  }
  static load(dirPath: string): Generator[] {
    let generatorsDir = join(dirPath, 'generators');
    if (!existsSync(generatorsDir)) {
      throw new Error(`It's expected a directory named "generators" with your generators`);
    }
    let files = readdirSync(generatorsDir).map((file) => {
      return join(generatorsDir, file);
    });

    let directories = files.filter((file) => {
      return statSync(file).isDirectory();
    });

    return directories.map((dir) => {
      return new Generator(dir);
    });
  }
  normalizeOptions(params): Object {
    let config = require(join(this.rootPath, 'index.js'));
    let fields = config.fields;
    let output = {};
    for (let field of fields) {
      if (params.hasOwnProperty(field.name)) {
        output[field.name] = params[field.name];
      } else if (field.hasOwnProperty('default')) {
        // TODO warn if default is undefined, on throw error
        if (typeof field.default === 'function') {
          output[field.name] = field.default();
        } else {
          output[field.name] = field.default;
        }
      }
    }
    return output;
  }
  getRequiredVariableNames(): string[] {
    let config = require(join(this.rootPath, 'index.js'));
    return config.fields.filter(f => !f.hasOwnProperty('default')).map(f => f.name);
  }
  getVariableNames(): string[] {
    let config = require(join(this.rootPath, 'index.js'));
    return config.fields.map(f => f.name);
  }
  getDescription(): string[] {
    let config = require(join(this.rootPath, 'index.js'));
    return config.description;
  }
  getFiles(): File[] {
    let templatesDir = join(this.rootPath, 'templates');
    let files = walkSync(templatesDir, { directories: false });
    return files.map(file => {
      return new File(templatesDir, file);
    });
  }
  create(options: RunOptions) {
    this.getFiles().forEach(file => {
      file.write(options.target, this.normalizeOptions(options.params));
    });
  }
  destroy(options: RunOptions) {
    this.getFiles().forEach(file => {
      file.remove(options.target, this.normalizeOptions(options.params));
    });
  }
}
