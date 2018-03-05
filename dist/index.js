process.env.HMR_PORT=55512;process.env.HMR_HOSTNAME="";// modules are defined as an array
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
})({3:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = exports.setWindow = exports.grabTokens = exports.getAlbumCover = exports.shuffle = exports.repeat = exports.skip = exports.playpause = exports.pause = exports.seek = exports.getCurrentAlbumId2 = exports.getCurrentAlbumId = exports.getStatus = exports.getJson = exports.getUrl = exports.generateUrl = exports.generateLocalHostname = undefined;

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _child_process = require('child_process');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _electronStore = require('electron-store');

var _electronStore2 = _interopRequireDefault(_electronStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const store = new _electronStore2.default({ name: 'auth' });

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
    const { access_token } = store.get('tokens');

    const options = {
        url: 'https://api.spotify.com/v1/me/player',
        headers: { Authorization: 'Bearer ' + access_token },
        json: true
    };
    _request2.default.get(options, (err, res, body) => {
        if (body.error && body.error.status === 401) store.delete('tokens');
        console.log({ body });
    });
};

const getCurrentAlbumId2 = exports.getCurrentAlbumId2 = () => {
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
                const { track } = data;

                const trackInfo = {
                    song: track.track_resource.name,
                    album: track.album_resource.name,
                    artist: track.artist_resource.name,
                    time: {
                        length: track.length / 60,
                        current: Math.round(data.playing_position),
                        remaining: parseFloat(track.length / 60).toFixed(2)
                    }
                };
                // console.log(trackInfo);

                mainWindow.webContents.send('trackInfo', trackInfo);

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
},{}],12:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _electron = require('electron');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _electronStore = require('electron-store');

var _electronStore2 = _interopRequireDefault(_electronStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const store = new _electronStore2.default({ name: 'auth' });
const router = (0, _express.Router)();

const stateKey = 'spotify_auth_state';
const tokenStatekey = 'tokens';
const client_id = 'dac3a81dc39d4871bed298674cbb19d9'; // Your client id
const client_secret = 'd3c86d0a9bac494bad1069ac6ecedc2d'; // Your secret
const redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
let authWindow;

const generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/login', (req, res) => {
    authWindow = new _electron.BrowserWindow({ width: 600, height: 700 });
    const state = generateRandomString(16);
    store.set(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email playlist-read-private user-top-read user-library-read playlist-modify-private user-read-currently-playing user-read-recently-played user-follow-modify user-modify-playback-state user-read-playback-state user-follow-read user-library-modify streaming playlist-modify-public playlist-read-collaborative';
    authWindow.loadURL('https://accounts.spotify.com/authorize?' + _querystring2.default.stringify({
        response_type: 'code',
        client_id,
        scope,
        redirect_uri,
        state
    }));
});

router.get('/callback', (req, res) => {
    // your application requests refresh and access tokens
    // after checking the state parameter

    const { query: { code = null, state = null } } = req;
    const storedState = store.get(stateKey) || null;

    if (state === null || state !== storedState) {
        // not sure what to do here.
        // res.status(401).send('state_mismatch');
    } else {
        store.delete(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code,
                redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                Authorization: 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
            },
            json: true
        };

        _request2.default.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                const { access_token, refresh_token } = body;

                store.set(tokenStatekey, { access_token, refresh_token });

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { Authorization: 'Bearer ' + access_token },
                    json: true
                };

                authWindow.close();

                // use the access token to access the Spotify Web API
                // request.get(options, function(error, response, body) {
                //     console.log(body);
                // });

                // we can also pass the token to the browser to make requests from there
                // res.redirect(
                //     '/#' +
                //         querystring.stringify({
                //             access_token: access_token,
                //             refresh_token: refresh_token,
                //         })
                // );
            } else {
                    // res.redirect(
                    //     '/#' +
                    //         querystring.stringify({
                    //             error: 'invalid_token',
                    //         })
                    // );
                }
        });
    }
});

exports.default = router;
},{}],1:[function(require,module,exports) {
'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _menubar = require('menubar');

var _menubar2 = _interopRequireDefault(_menubar);

var _electron = require('electron');

var _electron2 = _interopRequireDefault(_electron);

var _autoLaunch = require('auto-launch');

var _autoLaunch2 = _interopRequireDefault(_autoLaunch);

var _spotify = require('./spotify.js');

var spotify = _interopRequireWildcard(_spotify);

var _authenticate = require('./authenticate');

var _authenticate2 = _interopRequireDefault(_authenticate);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const app = (0, _express2.default)();

app.use('/', _authenticate2.default);

const mb = (0, _menubar2.default)({
    dir: __dirname + '/../',
    preloadWindow: true,
    height: 550
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
    mb.window.openDevTools();
    mb.window.webContents.send('settings', settings);
});

_electron.ipcMain.on('seek', (event, percent) => spotify.seek(percent));

_electron.ipcMain.on('playpause', (event, data) => spotify.playpause());

_electron.ipcMain.on('skip', (event, data) => spotify.skip(data));

_electron.ipcMain.on('shuffle', (event, data) => spotify.shuffle(data));

_electron.ipcMain.on('repeat', (event, data) => spotify.repeat(data));

console.log('Listing to http://localhost:3000');
app.listen(3000);
},{"./spotify.js":3,"./authenticate":12}],14:[function(require,module,exports) {
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

},{}]},{},[14,1])
//# sourceMappingURL=/dist/index.map