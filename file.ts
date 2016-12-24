import { template, mixin, flow, camelCase, upperFirst } from 'lodash';
import { readFileSync, outputFileSync, removeSync, readdirSync, rmdirSync, existsSync } from 'fs-extra';
import { join, dirname } from 'path';

mixin({ 'classify': flow(camelCase, upperFirst) });

interface FileParams {
  [key: string]: any
}

export default class File {
  absolutePath: string
  constructor(public rootPath: string, public relativePath: string) {
    this.absolutePath = join(this.rootPath, this.relativePath);
  }
  write(targetDir: string, params: FileParams) {
    let fileTemplate = readFileSync(this.absolutePath, 'utf8');
    let compiledTemplate = template(fileTemplate)(params);
    let targetPath = template(this.relativePath)(params);
    outputFileSync(join(targetDir, targetPath), compiledTemplate);
    // TODO use chalk
    console.log('created', targetPath);
  }
  remove(targetDir: string, params: FileParams) {
    let targetPath = template(this.relativePath)(params);
    removeSync(join(targetDir, targetPath));
    // TODO use chalk
    console.log('removed', targetPath);
    this.findUpPaths(targetPath).forEach(this.removeEmptyDir);
  }
  private removeEmptyDir(dir) {
    if (existsSync(dir) && readdirSync(dir).length === 0) {
      rmdirSync(dir);
    }
  }
  private findUpPaths(path: string): string[] {
    let paths = [];
    let currentDir = path;
    while ((currentDir = dirname(currentDir)) !== '.') {
      paths.push(currentDir);
    }
    return paths;
  }
}
