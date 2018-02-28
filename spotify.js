import https from 'https';
import { exec } from 'child_process';
import request from 'request';

let spotifyPortOffset = 0;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.on('uncaughtException', function(error) {
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
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
    },
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

export const generateLocalHostname = () => '127.0.0.1';

export const generateUrl = (host, port, path) =>
    `http${port == 443 ? 's' : ''}://${host}:${port}${path}`;

export const getUrl = path => generateLocalHostname() + '/' + path;

export const getJson = ({ host, port, path, headers }, callback) => {
    const options = {
        url: generateUrl(host, port, path),
        rejectUnauthorized: false,
        headers,
    };
    request(options, (error, response, body) => callback(JSON.parse(body)));
};

export const getStatus = function() {
    const config = copyConfig({
        host: generateLocalHostname(),
        path: `/remote/status.json?oauth=${oauth}&csrf=${csrf}&returnafter=1returnon=${DEFAULT_RETURN_ON.join()}`,
    });
    getJson(config, console.log);
};

export const getCurrentAlbumId = () => {
    const config = copyConfig({
        host: generateLocalHostname(),
        path: `/remote/status.json?oauth=${oauth}&csrf=${csrf}&returnafter=1returnon=${DEFAULT_RETURN_ON.join()}`,
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
                mainWindow.webContents.send(
                    'position',
                    data.playing_position / data.track.length * 100
                );
                mainWindow.webContents.send('length', data.track.length);
                mainWindow.webContents.send('playing', data.playing);
                mainWindow.webContents.send('shuffle', data.shuffle);
                mainWindow.webContents.send('repeat', data.repeat);
                mainWindow.webContents.send('next_enabled', data.next_enabled);
                mainWindow.webContents.send('prev_enabled', data.prev_enabled);
                mainWindow.webContents.send(
                    'track',
                    data.track.track_resource.name
                );
                mainWindow.webContents.send(
                    'album',
                    data.track.album_resource.name
                );
                mainWindow.webContents.send(
                    'artist',
                    data.track.artist_resource.name
                );
            }
        } catch (ex) {
            console.log(ex);
        }
    });
};

export const seek = function(percent) {
    var time = percent / 100 * track.length;
    exec(
        'osascript -e \'tell application "Spotify" to set player position to ' +
            time +
            "'"
    );
};

export const pause = function(pause) {
    exec(
        'osascript -e \'tell application "Spotify" to ' + pause
            ? 'pause'
            : 'play' + "'"
    );
};

export const playpause = function() {
    exec('osascript -e \'tell application "Spotify" to playpause\'');
};

export const skip = function(forward) {
    exec(
        'osascript -e \'tell application "Spotify" to ' +
            (forward ? 'next' : 'previous') +
            " track'"
    );
};

export const repeat = function(repeating) {
    exec(
        'osascript -e \'tell application "Spotify" to set repeating to ' +
            repeating +
            "'"
    );
};

export const shuffle = function(shuffle) {
    exec(
        'osascript -e \'tell application "Spotify" to set shuffling to ' +
            shuffle +
            "'"
    );
};

export const getAlbumCover = function(id) {
    const config = copyConfig({
        host: 'open.spotify.com',
        path: `/oembed?url=${id}`,
        port: 443,
    });
    getJson(config, data => {
        console.log(data.thumbnail_url);
        coverUrl = data.thumbnail_url;
        if (typeof mainWindow !== 'undefined') {
            mainWindow.webContents.send('coverUrl', coverUrl);
        }
    });
};

export const grabTokens = function() {
    if (typeof mainWindow !== 'undefined') {
        mainWindow.webContents.send('loadingText', 'Connecting to Spotify...');
    }
    getJson(
        copyConfig({
            host: generateLocalHostname(),
            path: '/simplecsrf/token.json',
        }),
        data => {
            csrf = data.token;
        }
    );
    getJson(
        copyConfig({
            host: 'open.spotify.com',
            path: '/token',
            port: 443,
        }),
        function(data) {
            oauth = data.t;
        }
    );
    let updateTrackCover;
    let waitForRequest = setInterval(function() {
        if (
            typeof version !== 'undefined' &&
            typeof csrf !== 'undefined' &&
            typeof oauth !== 'undefined'
        ) {
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

export const setWindow = function(window) {
    mainWindow = window;
    //console.log(mainWindow);
};

export const init = function() {
    let waitForSpotify = setInterval(() => {
        if (typeof version !== 'undefined' && version.running) {
            clearInterval(waitForSpotify);
            grabTokens();
        } else {
            const config = copyConfig({
                host: generateLocalHostname(),
                path: '/service/version.json?service=remote',
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
