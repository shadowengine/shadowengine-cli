"use strict";

const Listr = require('listr');
const Promise = require('bluebird');
const fs = require('fs-extra');
const Observable = require('zen-observable');
const execa = require('execa');
const exists = require('fs-exists-sync');
const path = require('path');
const prompt = require('prompt');
const emptyDir = require('empty-dir');

const Command = require('../Command');

const VerboseRenderer = require('listr-verbose-renderer');
const UpdaterRenderer = require('listr-update-renderer');

prompt.message = "";

module.exports = class Create extends Command {

  execute() {
    const template     = this.args.template || "default";
    const templatePath = `${__dirname}/../../create-templates/${template}`;
    const localPath    = process.cwd();

    if(this.options.noEmptyDirWarning === false && emptyDir.sync('.') === false)
      return this.error("The working directory isn't empty, aborting. [--no-empty-dir-warning disables this check]");

    if(exists(`${templatePath}/__config.js`) === false)
      return this.error("This specified template doesn't exist, aborting.");

    const config = require(`${templatePath}/__config.js`);

    this.logger.info(`creating project from "${template}" template:`);

    prompt.start().get(this._createSchema(config.variables), (err, variables) => {
      if(err) return this.error(err);
      if(!variables) return process.exit(0);

      this.logger.info("");

      let tasks = [
        {
          title: "copy project files",
          task:  () => fs.copy(`${templatePath}`, localPath)
        },
        {
          title: "preparing project files",
          task: () => new Listr([
            { title: "get file list",                 task: (ctx) => this._readdir(localPath).then(files => ctx.files = files) },
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
        },
        {
          title: "install dependencies",
          task:  () => execa.stdout(`npm`, ['install', '--only=dev'])
        }
      ];

      return (new Listr(tasks, { renderer: this.isVerbose() ? VerboseRenderer : UpdaterRenderer, collapse: false }))
        .run().catch(e => this.isVerbose() ? console.error(e) : null);
    });
  }

  _createSchema(variables) {
    const schema = { properties: {} };
    let longest = 0;
    for(let v in variables) {
      longest = Math.max(longest, variables[v][1].length);
      schema.properties[v] = {
        pattern:     variables[v][0],
        description: variables[v][1],
        default:     variables[v][2]
      };
    }
    for(let v in variables) {
      const desc = ((new Array(longest + 1)).join(" ") + schema.properties[v].description);
      schema.properties[v].description = desc.substr(desc.length - longest);
    }
    return schema;
  }

}
