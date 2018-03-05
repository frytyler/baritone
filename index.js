import express from 'express';
import menubar from 'menubar';
import electron, { ipcMain, Menu, BrowserWindow } from 'electron';
import AutoLaunch from 'auto-launch';

import * as spotify from './spotify.js';
import authentication from './authenticate';

const app = express();

app.use('/', authentication);

const mb = menubar({
    dir: __dirname + '/../',
    preloadWindow: true,
    height: 550,
});

let appLauncher = new AutoLaunch({
    name: 'spotifymenubar',
});

const settings = {
    showTrackTitle: true,
    smallAlbumArt: false,
};

const contextMenu = Menu.buildFromTemplate([
    {
        label: 'About Baritone',
        click: openAbout,
    },
    { type: 'separator' },
    {
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
        },
    },
    {
        label: 'Show Track Info',
        type: 'checkbox',
        checked: false,
        click: item => {
            settings.showTrackTitle = !settings.showTrackTitle;
            item.checked = settings.showTrackTitle;
            mb.window.webContents.send('settings', settings);
        },
        enabled: true,
    },
    { type: 'separator' },
    {
        label: 'Quit Baritone',
        click: () => mb.app.quit(),
    },
]);

appLauncher.isEnabled().then(enabled => {
    contextMenu.items[2].checked = enabled;
});

contextMenu.items[3].checked = settings.showTrackTitle;

function openSettings() {
    const settingsWindow = new BrowserWindow({ width: 400, height: 500 });

    settingsWindow.loadURL('file://' + __dirname + '/settings.html');
}

function openAbout() {
    const aboutWindow = new BrowserWindow({ width: 400, height: 320 });

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

ipcMain.on('seek', (event, percent) => spotify.seek(percent));

ipcMain.on('playpause', (event, data) => spotify.playpause());

ipcMain.on('skip', (event, data) => spotify.skip(data));

ipcMain.on('shuffle', (event, data) => spotify.shuffle(data));

ipcMain.on('repeat', (event, data) => spotify.repeat(data));

console.log('Listing to http://localhost:3000');
app.listen(3000);
