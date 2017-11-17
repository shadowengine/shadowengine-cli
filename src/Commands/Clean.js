"use strict";

const Listr = require('listr');
const shell = require('shelljs');

const Command = require('../Command');

module.exports = class Clean extends Command {

  execute() {
    const localPath  = process.cwd();

    const tasks = new Listr([
      {
        title: "remove distribution files",
        task: () => shell.rm('-rf', `${localPath}/dist`)
      }
    ]);

    return (new Listr(tasks, { renderer: this.isVerbose() ? VerboseRenderer : UpdaterRenderer, collapse: false }))
      .run().catch(e => this.isVerbose() ? console.error(e) : null);
  }

}
