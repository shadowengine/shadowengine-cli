#!/usr/bin/env node

const Caporal = require('caporal');
const Package = require('./package.json');
Caporal.version(Package.version);

const command = cmdClass => (args, options, logger) => {
  const cmd = new cmdClass(args, options, logger);
  cmd.execute();
};

const CommandBuild = require('./src/Commands/Build');
Caporal.command('build', 'Build the current project')
  .argument('[target]', 'Specifies which target to build for', null, "web")
  .option('--platform', 'Specifies specific platforms to build for', null, false)
  .action(command(CommandBuild));

const CommandCreate = require('./src/Commands/Create');
Caporal.command('create', 'Create a new project from boilerplate')
  .argument('[template]', 'the template to create from', null, "default")
  .option('--no-empty-dir-warning', 'allow creation in non-empty directories', Caporal.BOOL, false)
  .action(command(CommandCreate));

const CommandClean = require('./src/Commands/Clean');
Caporal.command('clean', 'Cleans up any built files from the project')
  .action(command(CommandClean));

const CommandLink = require('./src/Commands/Link');
Caporal.command('link', 'Link shadowengine dev folders as modules')
  .action(command(CommandLink));

Caporal.parse(process.argv);
