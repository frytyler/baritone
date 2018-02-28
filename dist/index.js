process.env.HMR_PORT=60673;process.env.HMR_HOSTNAME="";// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({2:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = exports.setWindow = exports.grabTokens = exports.getAlbumCover = exports.shuffle = exports.repeat = exports.skip = exports.playpause = exports.pause = exports.seek = exports.getCurrentAlbumId = exports.getStatus = exports.getJson = exports.getUrl = exports.generateUrl = exports.generateLocalHostname = undefined;

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _child_process = require('child_process');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let spotifyPortOffset = 0;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.on('uncaughtException', function (error) {
    console.log(error);
    if (error.code == 'ECONNRESET') {
        spotifyPortOffset++;
        console.log('connection failed; trying new port...');
    }
});

const SERVER_PORT = 5000;
const UPDATE_INTERVAL = 1000;
const DEFAULT_RETURN_ON = ['login', 'logout', 'play', 'pause', 'error', 'ap'];

const DEFAULT_HTTPS_CONFIG = {
    host: '',
    port: 4380,
    path: '',
    headers: {
        Origin: 'https://open.spotify.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};

let version = { running: false };
let csrf;
let oauth;
let albumId;
let coverUrl;
let mainWindow;
let trackUri;
let track;

function copyConfig(configOverride) {
    const configCopy = JSON.parse(JSON.stringify(DEFAULT_HTTPS_CONFIG));
    configCopy.port += spotifyPortOffset % 10;
    return Object.assign({}, configCopy, configOverride);
}

const generateLocalHostname = exports.generateLocalHostname = () => '127.0.0.1';

const generateUrl = exports.generateUrl = (host, port, path) => `http${port == 443 ? 's' : ''}://${host}:${port}${path}`;

const getUrl = exports.getUrl = path => generateLocalHostname() + '/' + path;

const getJson = exports.getJson = ({ host, port, path, headers }, callback) => {
    const options = {
        url: generateUrl(host, port, path),
        rejectUnauthorized: false,
        headers
    };
    (0, _request2.default)(options, (error, response, body) => callback(JSON.parse(body)));
};

const getStatus = exports.getStatus = function () {
    const config = copyConfig({
        host: generateLocalHostname(),
        path: `/remote/status.json?oauth=${oauth}&csrf=${csrf}&returnafter=1returnon=${DEFAULT_RETURN_ON.join()}`
    });
    getJson(config, console.log);
};

const getCurrentAlbumId = exports.getCurrentAlbumId = () => {
    const config = copyConfig({
        host: generateLocalHostname(),
        path: `/remote/status.json?oauth=${oauth}&csrf=${csrf}&returnafter=1returnon=${DEFAULT_RETURN_ON.join()}`
    });
    getJson(config, data => {
        if (typeof mainWindow !== 'undefined') {
            mainWindow.webContents.send('running', data.running);
        }
        try {
            if (data.track.album_resource.uri !== albumId) {
                console.log('album updated');
                albumId = data.track.album_resource.uri;
                track = data.track;
                console.log({ albumId });
                getAlbumCover(albumId);
            } else {
                if (typeof mainWindow !== 'undefined') {
                    mainWindow.webContents.send('coverUrl', coverUrl);
                }
            }
            if (typeof mainWindow !== 'undefined') {
                mainWindow.webContents.send('position', data.playing_position / data.track.length * 100);
                mainWindow.webContents.send('length', data.track.length);
                mainWindow.webContents.send('playing', data.playing);
                mainWindow.webContents.send('shuffle', data.shuffle);
                mainWindow.webContents.send('repeat', data.repeat);
                mainWindow.webContents.send('next_enabled', data.next_enabled);
                mainWindow.webContents.send('prev_enabled', data.prev_enabled);
                mainWindow.webContents.send('track', data.track.track_resource.name);
                mainWindow.webContents.send('album', data.track.album_resource.name);
                mainWindow.webContents.send('artist', data.track.artist_resource.name);
            }
        } catch (ex) {
            console.log(ex);
        }
    });
};

const seek = exports.seek = function (percent) {
    var time = percent / 100 * track.length;
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to set player position to ' + time + "'");
};

const pause = exports.pause = function (pause) {
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to ' + pause ? 'pause' : 'play' + "'");
};

const playpause = exports.playpause = function () {
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to playpause\'');
};

const skip = exports.skip = function (forward) {
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to ' + (forward ? 'next' : 'previous') + " track'");
};

const repeat = exports.repeat = function (repeating) {
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to set repeating to ' + repeating + "'");
};

const shuffle = exports.shuffle = function (shuffle) {
    (0, _child_process.exec)('osascript -e \'tell application "Spotify" to set shuffling to ' + shuffle + "'");
};

const getAlbumCover = exports.getAlbumCover = function (id) {
    const config = copyConfig({
        host: 'open.spotify.com',
        path: `/oembed?url=${id}`,
        port: 443
    });
    getJson(config, data => {
        console.log(data.thumbnail_url);
        coverUrl = data.thumbnail_url;
        if (typeof mainWindow !== 'undefined') {
            mainWindow.webContents.send('coverUrl', coverUrl);
        }
    });
};

const grabTokens = exports.grabTokens = function () {
    if (typeof mainWindow !== 'undefined') {
        mainWindow.webContents.send('loadingText', 'Connecting to Spotify...');
    }
    getJson(copyConfig({
        host: generateLocalHostname(),
        path: '/simplecsrf/token.json'
    }), data => {
        csrf = data.token;
    });
    getJson(copyConfig({
        host: 'open.spotify.com',
        path: '/token',
        port: 443
    }), function (data) {
        oauth = data.t;
    });
    let updateTrackCover;
    let waitForRequest = setInterval(function () {
        if (typeof version !== 'undefined' && typeof csrf !== 'undefined' && typeof oauth !== 'undefined') {
            clearInterval(waitForRequest);
            console.log('done.');
            console.log({ version });
            console.log({ csrf });
            console.log({ oauth });
            updateTrackCover = setInterval(getCurrentAlbumId, UPDATE_INTERVAL);
        } else {
            console.log('waiting for authentication...');
        }
    }, 500);
};

const setWindow = exports.setWindow = function (window) {
    mainWindow = window;
    //console.log(mainWindow);
};

const init = exports.init = function () {
    let waitForSpotify = setInterval(() => {
        if (typeof version !== 'undefined' && version.running) {
            clearInterval(waitForSpotify);
            grabTokens();
        } else {
            const config = copyConfig({
                host: generateLocalHostname(),
                path: '/service/version.json?service=remote'
            });
            getJson(config, (data, port) => {
                if (!('running' in data)) {
                    data.running = true;
                }
                version = data;
                console.log(version);
                console.log('port: ' + port);
                config.port = port;
            });
            console.log('waiting for spotify...');
            config.port++;
        }
    }, 500);
};
},{}],1:[function(require,module,exports) {
'use strict';

var _menubar = require('menubar');

var _menubar2 = _interopRequireDefault(_menubar);

var _electron = require('electron');

var _electron2 = _interopRequireDefault(_electron);

var _autoLaunch = require('auto-launch');

var _autoLaunch2 = _interopRequireDefault(_autoLaunch);

var _spotify = require('./spotify.js');

var spotify = _interopRequireWildcard(_spotify);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mb = (0, _menubar2.default)({
    dir: __dirname + '/../',
    preloadWindow: true,
    height: 464
});

let appLauncher = new _autoLaunch2.default({
    name: 'spotifymenubar'
});

const settings = {
    showTrackTitle: true,
    smallAlbumArt: false
};

const contextMenu = _electron.Menu.buildFromTemplate([{
    label: 'About Baritone',
    click: openAbout
}, { type: 'separator' }, {
    label: 'Launch on Login',
    type: 'checkbox',
    checked: false,
    click: item => {
        appLauncher.isEnabled().then(enabled => {
            if (enabled) {
                return appLauncher.disable().then(() => {
                    item.checked = false;
                });
            } else {
                return appLauncher.enable().then(() => {
                    item.checked = true;
                });
            }
        });
    }
}, {
    label: 'Show Track Info',
    type: 'checkbox',
    checked: false,
    click: item => {
        settings.showTrackTitle = !settings.showTrackTitle;
        item.checked = settings.showTrackTitle;
        mb.window.webContents.send('settings', settings);
    },
    enabled: true
}, { type: 'separator' }, {
    label: 'Quit Baritone',
    click: () => mb.app.quit()
}]);

appLauncher.isEnabled().then(enabled => {
    contextMenu.items[2].checked = enabled;
});

contextMenu.items[3].checked = settings.showTrackTitle;

function openSettings() {
    const settingsWindow = new _electron.BrowserWindow({ width: 400, height: 500 });

    settingsWindow.loadURL('file://' + __dirname + '/settings.html');
}

function openAbout() {
    const aboutWindow = new _electron.BrowserWindow({ width: 400, height: 320 });

    aboutWindow.loadURL('file://' + __dirname + '/../about.html');
}

mb.on('ready', () => {
    console.log('app is ready');
    spotify.init();
    mb.tray.on('right-click', () => {
        mb.tray.popUpContextMenu(contextMenu);
    });
});

mb.on('after-create-window', () => {
    spotify.setWindow(mb.window);
    mb.window.webContents.send('settings', settings);
});

_electron.ipcMain.on('seek', (event, percent) => spotify.seek(percent));

_electron.ipcMain.on('playpause', (event, data) => spotify.playpause());

_electron.ipcMain.on('skip', (event, data) => spotify.skip(data));

_electron.ipcMain.on('shuffle', (event, data) => spotify.shuffle(data));

_electron.ipcMain.on('repeat', (event, data) => spotify.repeat(data));
},{"./spotify.js":2}],3:[function(require,module,exports) {
var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = process.env.HMR_HOSTNAME || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + process.env.HMR_PORT + '/');
  ws.onmessage = function(event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      }
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id)
  });
}

},{}]},{},[3,1])
//# sourceMappingURL=/dist/index.map