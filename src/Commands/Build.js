"use strict";

const Listr = require('listr');
const Promise = require('bluebird');
const fs = require('fs-extra');
const Observable = require('zen-observable');
const execa = require('execa');
const exists = require('fs-exists-sync');

const Command = require('../Command');

const VerboseRenderer = require('listr-verbose-renderer');
const UpdaterRenderer = require('listr-update-renderer');

module.exports = class Build extends Command {

  execute() {
    const target     = this.args.target || "web";
    const targetPath = `${__dirname}/../../build-targets/${target}`;
    const localPath  = process.cwd();
    const buildDest  = `${localPath}/dist/${target}`;

    if(exists(`${targetPath}/__config.js`) === false)
      return this.error("This specified build target doesn't exist, aborting.");

    const config = require(`${targetPath}/__config.js`);
    const pkg    = require(`${localPath}/package.json`);

    const variables = {
      "FULL_NAME":    pkg.full_name,
      "NAME":         pkg.name,
      "VERSION":      pkg.version,
      "DESCRIPTION":  pkg.description,
      "LICENSE":      pkg.license,
      "AUTHOR_NAME":  pkg.author.name,
      "AUTHOR_EMAIL": pkg.author.email,
      "AUTHOR_URL":   pkg.author.url
    };
    variables.CREATION_TIME = (new Date()).toString();

    this.logger.info(`building project for "${target}" target:`);

    this.options.platform = this.options.platform || [];

    let tasks = [
      {
        title: "creating build target folder",
        task: () => fs.emptyDir(buildDest)
      },
      {
        title: "copying target files",
        task: () => fs.copy(targetPath, buildDest, { filter: (src, dest) => dest != `${buildDest}/__config.js` })
      },
      {
        title: "building source bundle",
        task: () => new Listr([
          { title: "run webpack",       task: () => execa.stdout(`webpack`, []) },
          { title: "copy built bundle", task: () => fs.copy(`${localPath}/dist/bundle.js`, `${buildDest}/bundle.js`) }
        ])
      },
      {
        title: "preparing build files",
        task: () => new Listr([
          { title: "get file list",                 task: (ctx) => this._readdir(buildDest).then(files => ctx.files = files) },
          { title: "substitute variables in files", task: (ctx) => new Observable(observer => {
            Promise.mapSeries(ctx.files, file => {
              observer.next(file.file);
              return this._replaceInFile(file, variables);
            }).then(() => observer.complete());
          }) },
          { title: "substitute variables in paths", task: (ctx) => new Observable(observer => {
            Promise.mapSeries(ctx.files, file => {
              observer.next(file.file);
              return this._replaceInPath(file, variables);
            }).then(() => observer.complete());
          }) }
        ])
      }
    ];

    if(typeof config.onBuild == 'function')
      tasks = tasks.concat(config.onBuild(this, localPath, buildDest));

    return (new Listr(tasks, { renderer: this.isVerbose() ? VerboseRenderer : UpdaterRenderer, collapse: false }))
      .run().catch(e => this.isVerbose() ? console.error(e) : null);
  }

}
