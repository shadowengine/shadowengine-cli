const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

class Window {

  createWindow() {
    this._window = new BrowserWindow({ width: 800, height: 600 });

    //this._window.setMenu(null);
    //this._window.maximize();

    this._window.on('closed', () => this._window = null);

    this._window.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes:  true
    }));
  }

  constructor() {
    this._window = null;
    app.on('ready',             () => this.createWindow());
    app.on('window-all-closed', () => app.quit());
  }

}

new Window();
