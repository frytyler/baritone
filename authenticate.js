import { Router } from 'express';
import querystring from 'querystring';
import { BrowserWindow } from 'electron';
import request from 'request';
import Store from 'electron-store';

const store = new Store({ name: 'auth' });
const router = Router();

const stateKey = 'spotify_auth_state';
const tokenStatekey = 'tokens';
const client_id = 'dac3a81dc39d4871bed298674cbb19d9'; // Your client id
const client_secret = 'd3c86d0a9bac494bad1069ac6ecedc2d'; // Your secret
const redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
let authWindow;

const generateRandomString = function(length) {
    var text = '';
    var possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/login', (req, res) => {
    authWindow = new BrowserWindow({ width: 600, height: 700 });
    const state = generateRandomString(16);
    store.set(stateKey, state);

    // your application requests authorization
    var scope =
        'user-read-private user-read-email playlist-read-private user-top-read user-library-read playlist-modify-private user-read-currently-playing user-read-recently-played user-follow-modify user-modify-playback-state user-read-playback-state user-follow-read user-library-modify streaming playlist-modify-public playlist-read-collaborative';
    authWindow.loadURL(
        'https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id,
                scope,
                redirect_uri,
                state,
            })
    );
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
                grant_type: 'authorization_code',
            },
            headers: {
                Authorization:
                    'Basic ' +
                    new Buffer(client_id + ':' + client_secret).toString(
                        'base64'
                    ),
            },
            json: true,
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                const { access_token, refresh_token } = body;

                store.set(tokenStatekey, { access_token, refresh_token });

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { Authorization: 'Bearer ' + access_token },
                    json: true,
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

export default router;
