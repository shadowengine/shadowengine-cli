"use strict";
const path = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');
const Listr = require('listr');
const execa = require('execa');
const builder = require("electron-builder");

const electronBuild = (buildDest, target, ctx, cmd) => {
  const cwd = process.cwd();
  process.chdir(buildDest);

  cmd.suppressOutput();
  if(cmd.isVerbose())
    process.env.DEBUG = "electron-builder";

  return builder.build({
    targets: target,
    config: {
      appId:       "shadoweng." + ctx.pkg.name,
      productName: ctx.pkg.name,
      nsis:        {
        oneClick:                           false,
        artifactName:                       "${name}-Setup-${version}.${ext}",
        menuCategory:                       true,
        runAfterFinish:                     false,
        createDesktopShortcut:              false,
        allowToChangeInstallationDirectory: true
      }
    }
  }).then(files => {
    cmd.resumeOutput();

    process.chdir(cwd);

    const tmpDir = tmp.dirSync();
    return fs.move(`${buildDest}/dist`, tmpDir.name)
      .then(() => fs.emptyDir(`${buildDest}`))
      .then(() => fs.move(`${tmpDir.name}`, `${buildDest}`))
      .then(() => fs.emptyDir(`${tmpDir.name}`))
      .then(() => tmpDir.removeCallback());
  });
};

module.exports = {
  name:        "electron",
  description: "builds project using electron",
  onBuild:     (cmd, localPath, buildDest) => [
    {
      title: "prepare static package metadata",
      task:  (ctx) => {
        const pkg = require(`${localPath}/package.json`);
        pkg.dependencies = {};
        pkg.devDependencies = {};
        pkg.devDependencies.electron = "1.7.8";
        pkg.main = "index.js";
        ctx.pkg = pkg;
        return fs.writeJson(`${buildDest}/package.json`, pkg, { spaces: '\t' });
      }
    },
    {
      title: "prepare project resources",
      task:  () => new Listr([
        {
          title: "create build directory",
          task: () => fs.ensureDir(`${buildDest}/build`)
        },
        {
          title: "copy win32 icon",
          skip:  () => {
            if(!fs.pathExistsSync(`${localPath}/resources/icon.ico`))
              return "'resources/icon.ico' file is missing, skipping";
          },
          task:  (ctx, task) => fs.copy(`${localPath}/resources/icon.ico`, `${buildDest}/build/icon.ico`)
        },
        {
          title: "copy mac icon",
          skip:  () => {
            if(!fs.pathExistsSync(`${localPath}/resources/icon.icns`))
              return "'resources/icon.icns' file is missing, skipping";
          },
          task:  (ctx, task) => fs.copy(`${localPath}/resources/icon.icns`, `${buildDest}/build/icon.icns`)
        },
        {
          title: "copy mac background",
          skip:  () => {
            if(!fs.pathExistsSync(`${localPath}/resources/background.png`))
              return "'resources/background.png' file is missing, skipping";
          },
          task:  (ctx, task) => fs.copy(`${localPath}/resources/background.png`, `${buildDest}/build/background.png`)
        },
      ])
    },
    {
      title: "install additional dependencies",
      task:  () => execa.stdout(`npm`, ['install'])
    },
    {
      title: "build electron",
      task:  () => new Listr([
        {
          title: "for windows [nsis, appx]",
          skip:  () => {
            if(require('os').platform() == "win32" || cmd.options.platform.indexOf("win") !== -1)
              return false;
            return "skipping windows build due to invalid platform, force with --platforms=win";
          },
          task:  (ctx) => electronBuild(buildDest, builder.Platform.WINDOWS.createTarget(["portable", "nsis", "appx"], builder.Arch.ia32, builder.Arch.x64), ctx, cmd)
        },
        {
          title: "for mac",
          skip:  () => {
            if(require('os').platform() == "darwin" || cmd.options.platform.indexOf("mac") !== -1)
              return false;
            return "skipping mac build due to invalid platform, force with --platforms=mac";
          },
          task:  (ctx) => electronBuild(buildDest, builder.Platform.MAC.createTarget(), ctx, cmd)
        },
        {
          title: "for linux",
          skip:  () => {
            if(require('os').platform() == "linux" || cmd.options.platform.indexOf("linux") !== -1)
              return false;
            return "skipping linux build due to invalid platform, force with --platforms=linux";
          },
          task:  (ctx) => electronBuild(buildDest, builder.Platform.LINUX.createTarget(), ctx, cmd)
        }
      ])
    }
  ]
};
