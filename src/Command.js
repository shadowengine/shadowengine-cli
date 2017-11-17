"use strict";

const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');

module.exports = class Command {

  constructor(args, options, logger) {
    this.args     = args;
    this.options  = options;
    this.logger   = logger;
    this._stdout  = process.stdout.write;

    console.log("    _______ __             __                  _______               __              ");
    console.log("   |     __|  |--.---.-.--|  |.-----.--.--.--.|    ___|.-----.-----.|__|.-----.-----.");
    console.log("   |__     |     |  _  |  _  ||  _  |  |  |  ||    ___||     |  _  ||  ||     |  -__|");
    console.log("   |_______|__|__|___._|_____||_____|________||_______||__|__|___  ||__||__|__|_____|");
    console.log("                                                             |_____|                 \n");
  }

  suppressOutput() {
      process.stdout.write = line => {
        let stack = ((new Error()).stack).toString();
        if(stack.indexOf("listr-update-renderer") === -1 && !this.isVerbose()) return;
        this._stdout.apply(process.stdout, [line]);
      };
  }

  resumeOutput() {
    process.stdout.write = this._stdout;
  }

  error(message) {
    this.logger.error(message);
    process.exit(1);
  }

  isVerbose() {
    return this.logger.transports.caporal.level == "debug";
  }

  _readdir(dir, files) {
    files = files || [];
    return fs.readdir(dir).then(list => Promise.mapSeries(list, file => {
      file = path.resolve(dir, file);
      return fs.stat(file).then(stat => {
        const isDir = stat.isDirectory();

        if(!isDir)
          return files.push({ file, isDir });

        return this._readdir(file, files)
          .then(() => files.push({ file, isDir }));
      });
    })).then(() => Promise.resolve(files));
  }

  _replaceInFile(file, variables) {
    if(file.isDir == true)
      return Promise.resolve();

    return fs.readFile(file.file, "utf8").then(data => {
      let endData = data;

      for(let v in variables) {
        const value = variables[v] || "";
        endData = endData.replace(new RegExp(`{{{\\s*${v}\\s*}}}`, 'gi'), value);
      }

      if(endData == data)
        return Promise.resolve();

      return fs.writeFile(file.file, endData);
    });
  }

  _replaceInPath(file, variables) {
    let filePath = file.file.split(path.sep);
    let endFile = filePath[filePath.length - 1];

    for(let v in variables) {
      const value = variables[v] || "";
      endFile = endFile.replace(new RegExp(`___${v}___`, 'gi'), value);
    }

    filePath[filePath.length - 1] = endFile;

    if(filePath.join(path.sep) == file.file)
      return Promise.resolve();

    return fs.move(file.file, filePath.join(path.sep));
  }

}
