"use strict";
const path = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');
const Listr = require('listr');
const execa = require('execa');
const builder = require("electron-builder");

module.exports = {
  name:        "cordova",
  description: "builds project using cordova",
  onBuild:     (cmd, localPath, buildDest) => [
    {
      title: "prepare for cordova build",
      task:  () => new Listr([
        {
          title: "static package metadata",
          task:  (ctx) => {
            const pkg = require(`${localPath}/package.json`);
            pkg.dependencies = {};
            pkg.devDependencies = {};
            pkg.displayName = pkg.full_name;
            pkg.main = "index.js";
            ctx.pkg = pkg;
            return fs.writeJson(`${buildDest}/package.json`, pkg, { spaces: '\t' });
          }
        },
        {
          title: "change working dir",
          task:  (ctx) => {
            ctx.cwd = process.cwd();
            process.chdir(buildDest);
          }
        }
      ])
    },
    {
      title: "move bundle file",
      task:  () => fs.move(`${buildDest}/bundle.js`, `${buildDest}/www/bundle.js`)
    },
    {
      title: "build cordova app",
      task:  () => new Listr([
        {
          title: "for android [apk]",
          task:  () => new Listr([
            { title: "add platform",   task: (ctx) => execa.stdout("cordova", ["platform", "add", "android"]) },
            { title: "build platform", task: (ctx) => execa.stdout("cordova", ["build", "android"]) }
          ])
        }
      ])
    },
    {
      title: "restore working dir",
      task:  (ctx) => process.chdir(ctx.cwd)
    }
  ]
};
