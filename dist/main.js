// modules are defined as an array
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
exports.Wrapper = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Wrapper = exports.Wrapper = _styledComponents2.default.div`
    &:before {
        content: '';
        background-image: url(${({ image }) => image});
        background-size: cover;
        filter: blur(20px);
        opacity: 0.2;
        display: block;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: -1;
    }
`;
},{}],8:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Repeat = exports.PausePlay = exports.Next = exports.Previous = exports.Shuffle = exports.Main = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

var _reactFontawesome = require('@fortawesome/react-fontawesome');

var _reactFontawesome2 = _interopRequireDefault(_reactFontawesome);

var _fontawesomeFreeSolid = require('@fortawesome/fontawesome-free-solid');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Main = exports.Main = _styledComponents2.default.div`
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    color: #fff;
    width: 80%;
    /* height: 48px; */
    margin: 0 auto;
`;

const BaseIcon = (0, _styledComponents2.default)(_reactFontawesome2.default)`
    cursor: pointer;
`;

const Shuffle = exports.Shuffle = BaseIcon.extend`
    margin-top: 8px;
    font-size: 14px !important;
    color: ${({ active }) => active ? '#23CF5F' : '#ffffff'};
`;
Shuffle.defaultProps = { icon: _fontawesomeFreeSolid.faRandom };

const Previous = exports.Previous = BaseIcon.extend`
    margin-top: 3px;
    font-size: 20px !important;
`;
Previous.defaultProps = { icon: _fontawesomeFreeSolid.faStepBackward };

const Next = exports.Next = Previous.extend``;
Next.defaultProps = { icon: _fontawesomeFreeSolid.faStepForward };

const PausePlay = exports.PausePlay = Previous.extend`
    border: 1px solid rgba(255, 255, 255, 0.8);
    padding: 20px;
    border-radius: 50%;
    font-size: 36px;
`;

const Repeat = exports.Repeat = BaseIcon.extend`
    margin-top: 8px;
    font-size: 14px !important;
    color: ${({ active }) => active ? '#23CF5F' : '#ffffff'};
`;
Repeat.defaultProps = { icon: _fontawesomeFreeSolid.faRetweet };
},{}],3:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _electron = require('electron');

var _fontawesomeFreeSolid = require('@fortawesome/fontawesome-free-solid');

var _controlBar = require('./control-bar.styled');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ControlBar extends _react2.default.Component {
    render() {
        var _props = this.props;
        const shuffling = _props.shuffling,
              repeating = _props.repeating,
              playing = _props.playing;


        return _react2.default.createElement(
            _controlBar.Main,
            null,
            _react2.default.createElement(_controlBar.Shuffle, {
                active: shuffling,
                onClick: () => _electron.ipcRenderer.send('shuffle', !shuffling)
            }),
            _react2.default.createElement(_controlBar.Previous, { onClick: () => _electron.ipcRenderer.send('skip', false) }),
            _react2.default.createElement(_controlBar.PausePlay, {
                icon: playing ? _fontawesomeFreeSolid.faPause : _fontawesomeFreeSolid.faPlay,
                onClick: () => _electron.ipcRenderer.send('playpause', null)
            }),
            _react2.default.createElement(_controlBar.Next, { onClick: () => _electron.ipcRenderer.send('skip', true) }),
            _react2.default.createElement(_controlBar.Repeat, {
                active: repeating,
                onClick: () => _electron.ipcRenderer.send('repeat', !repeating)
            })
        );
    }
}

ControlBar.defaultProps = {
    shuffling: false,
    repeating: false,
    playing: false
};

exports.default = ControlBar;
},{"./control-bar.styled":8}],9:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Image = exports.Main = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Main = exports.Main = _styledComponents2.default.div`
    display: flex;
    justify-content: center;
    padding: 20px 0;
`;

const Image = exports.Image = _styledComponents2.default.img`
    width: 80%;
    height: 80%;
    border-radius: 2px;
`;
},{}],4:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _artWork = require('./art-work.styled');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ArtWork = ({ src, onLoad }) => _react2.default.createElement(
    _artWork.Main,
    null,
    _react2.default.createElement(_artWork.Image, { src: src, onLoad: onLoad })
);

exports.default = ArtWork;
},{"./art-work.styled":9}],10:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Message = exports.Heading = exports.Main = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Main = exports.Main = _styledComponents2.default.div`
    position: absolute;
    z-index: 1000;
    background: #272727;
    color: #fff;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    text-align: center;
    padding-top: 180px;
    font-size: 24px;
`;

const Heading = exports.Heading = _styledComponents2.default.span`
    text-transform: uppercase;
`;

const Message = exports.Message = _styledComponents2.default.div``;
},{}],5:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _loading = require('./loading.styled');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Loading = ({ heading, message }) => _react2.default.createElement(
    _loading.Main,
    null,
    _react2.default.createElement(
        _loading.Heading,
        null,
        heading
    ),
    _react2.default.createElement(
        _loading.Message,
        null,
        message
    )
);

exports.default = Loading;
},{"./loading.styled":10}],11:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Progress = exports.Bar = exports.Main = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Main = exports.Main = _styledComponents2.default.div`
    display: flex;
    justify-content: center;
    padding: 10px;
`;

const Bar = exports.Bar = _styledComponents2.default.div`
    background: rgba(255, 255, 255, 0.3);
    width: 100%;
    height: 2px;
    border-radius: 2px;
`;

const Progress = exports.Progress = _styledComponents2.default.div`
    background-color: #ffffff;
    width: ${({ progress }) => `${progress}vw`};
    height: 2px;
    border-radius: 2px;
    position: relative;
    &:after {
        content: '';
        position: absolute;
        top: -2px;
        right: 0;
        display: block;
        width: 6px;
        height: 6px;
        background: #fff;
        border-radius: 50%;
    }
`;
},{}],6:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _progressBar = require('./progress-bar.styled');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ProgressBar = ({ progress = 0 }) => _react2.default.createElement(
    _progressBar.Main,
    null,
    _react2.default.createElement(
        _progressBar.Bar,
        null,
        _react2.default.createElement(_progressBar.Progress, { progress: progress })
    )
);

exports.default = ProgressBar;
},{"./progress-bar.styled":11}],12:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Artist = exports.Song = exports.Main = undefined;

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Main = exports.Main = _styledComponents2.default.div`
    text-align: center;
`;

const Song = exports.Song = _styledComponents2.default.h1`
    color: white;
    font-size: 16px;
    font-weight: 500;
`;

const Artist = exports.Artist = _styledComponents2.default.h2`
    color: white;
    font-size: 12px;
    font-weight: 300;
`;
},{}],7:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _trackInfo = require('./track-info.styled');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TrackInfo = ({ trackInfo: { song, artist } }) => _react2.default.createElement(
    _trackInfo.Main,
    null,
    _react2.default.createElement(
        _trackInfo.Song,
        null,
        song
    ),
    _react2.default.createElement(
        _trackInfo.Artist,
        null,
        artist
    )
);

exports.default = TrackInfo;
},{"./track-info.styled":12}],14:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _styledComponents = require('styled-components');

var _styledComponents2 = _interopRequireDefault(_styledComponents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const LoginButton = _styledComponents2.default.a``;

const Login = () => {
    return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
            LoginButton,
            { href: 'http://localhost:3000/login' },
            'Please log in'
        )
    );
};

exports.default = Login;
},{}],1:[function(require,module,exports) {
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _electron = require('electron');

var _electronStore = require('electron-store');

var _electronStore2 = _interopRequireDefault(_electronStore);

var _main = require('./main.styled');

var _controlBar = require('./components/control-bar/control-bar');

var _controlBar2 = _interopRequireDefault(_controlBar);

var _artWork = require('./components/art-work/art-work');

var _artWork2 = _interopRequireDefault(_artWork);

var _loading = require('./components/loading/loading');

var _loading2 = _interopRequireDefault(_loading);

var _progressBar = require('./components/progress-bar/progress-bar');

var _progressBar2 = _interopRequireDefault(_progressBar);

var _trackInfo = require('./components/track-info/track-info');

var _trackInfo2 = _interopRequireDefault(_trackInfo);

var _login = require('./components/login/login');

var _login2 = _interopRequireDefault(_login);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const store = new _electronStore2.default({ name: 'auth' });

class Main extends _react2.default.Component {
    constructor(props) {
        super(props);
        this.state = {
            playing: false,
            repeating: false,
            shuffling: false,
            requireAuth: true,
            artWorkSrc: null,
            progress: 0,
            loading: {
                heading: 'One Moment',
                message: ''
            },
            trackInfo: {
                song: '',
                album: '',
                artist: ''
            }
        };

        this.clearLoading = this.clearLoading.bind(this);
    }

    componentDidMount() {
        _electron.ipcRenderer.on('playing', (e, playing) => {
            if (!!playing !== this.state.playing) {
                this.setState({ playing: !!playing });
            }
        });

        _electron.ipcRenderer.on('coverUrl', (e, url) => {
            if (url !== this.state.src) {
                this.setState({ artWorkSrc: url });
            }
        });

        _electron.ipcRenderer.on('position', (e, percent) => {
            this.setState({ progress: percent });
        });

        _electron.ipcRenderer.on('trackInfo', (e, trackInfo) => {
            if (trackInfo.song !== this.state.trackInfo.song) {
                this.setState({ trackInfo });
            }
        });

        _electron.ipcRenderer.on('repeat', (e, repeating) => {
            if (repeating !== this.state.repeating) {
                this.setState({ repeating });
            }
        });

        _electron.ipcRenderer.on('shuffle', (e, shuffling) => {
            if (shuffling !== this.state.shuffling) {
                this.setState({ shuffling });
            }
        });

        var _ref = store.get('tokens') || {},
            _ref$access_token = _ref.access_token;

        const access_token = _ref$access_token === undefined ? false : _ref$access_token;

        if (access_token) this.setState({ requireAuth: false });
    }

    clearLoading() {
        this.setState({ loading: false });
    }

    render() {
        var _state = this.state;
        const playing = _state.playing,
              repeating = _state.repeating,
              shuffling = _state.shuffling,
              artWorkSrc = _state.artWorkSrc,
              loading = _state.loading,
              progress = _state.progress,
              trackInfo = _state.trackInfo,
              requireAuth = _state.requireAuth;


        if (requireAuth) return _react2.default.createElement(_login2.default, null);

        return _react2.default.createElement(
            _main.Wrapper,
            { image: artWorkSrc },
            _react2.default.createElement(_artWork2.default, { src: artWorkSrc, onLoad: this.clearLoading }),
            loading && _react2.default.createElement(_loading2.default, loading),
            _react2.default.createElement(_trackInfo2.default, { trackInfo: trackInfo }),
            _react2.default.createElement(_progressBar2.default, { progress: progress }),
            _react2.default.createElement(_controlBar2.default, {
                playing: playing,
                repeating: repeating,
                shuffling: shuffling
            })
        );
    }
}

(0, _reactDom.render)(_react2.default.createElement(Main, null), document.getElementById('main'));
},{"./main.styled":2,"./components/control-bar/control-bar":3,"./components/art-work/art-work":4,"./components/loading/loading":5,"./components/progress-bar/progress-bar":6,"./components/track-info/track-info":7,"./components/login/login":14}]},{},[1])
//# sourceMappingURL=/dist/main.map