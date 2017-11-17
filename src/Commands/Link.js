"use strict";

const Listr = require('listr');
const fs = require('fs-extra');
const path = require('path');
const prompt = require('prompt');
const execa = require('execa');

const Command = require('../Command');

const VerboseRenderer = require('listr-verbose-renderer');
const UpdaterRenderer = require('listr-update-renderer');

prompt.message = "";

const linkedModules = [
  "shadowengine"
];

module.exports = class Create extends Command {

  execute() {
    const localPath = process.cwd();


    prompt.start().get({
      properties: {
        path: { pattern: "", description: "path to shadowengine dev folder", default: "../" }
      }
    }, (err, variables) => {
      if(err) return this.error(err);
      if(!variables) return process.exit(0);

      this.logger.info("");
      this.logger.info(`preparing project to use linked development modules:`);

      variables.path = path.resolve(variables.path);

      const prepareTasks = [];
      const createTasks  = [];
      linkedModules.forEach(moduleName => {
        prepareTasks.push({ title: moduleName, task: () => this._prepareLink(moduleName, variables.path) });
        createTasks.push({ title: moduleName, task: () => this._createLink(moduleName) });
      });

      let tasks = [
        {
          title: "prepare npm links",
          task:  () => new Listr(prepareTasks)
        },
        {
          title: "create npm links",
          task:  () => new Listr(createTasks)
        }
      ];

      return (new Listr(tasks, { renderer: this.isVerbose() ? VerboseRenderer : UpdaterRenderer, collapse: false }))
        .run().catch(e => this.isVerbose() ? console.error(e) : null);
    });
  }

  _prepareLink(moduleName, devPath) {
    const cwd = process.cwd();
    process.chdir(path.join(devPath, moduleName));
    return execa.stdout("npm", ["link"])
      .then(() => process.chdir(cwd));
  }

  _createLink(moduleName) {
    return execa.stdout("npm", ["link", moduleName]);
  }

}
