import React from 'react';
import { render } from 'react-dom';
import { ipcRenderer as ipc } from 'electron';
import Store from 'electron-store';

import { Wrapper } from './main.styled';

import ControlBar from './components/control-bar/control-bar';
import ArtWork from './components/art-work/art-work';
import Loading from './components/loading/loading';
import ProgressBar from './components/progress-bar/progress-bar';
import TrackInfo from './components/track-info/track-info';
import Login from './components/login/login';

const store = new Store({ name: 'auth' });

class Main extends React.Component {
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
                message: '',
            },
            trackInfo: {
                song: '',
                album: '',
                artist: '',
            },
        };

        this.clearLoading = this.clearLoading.bind(this);
    }

    componentDidMount() {
        ipc.on('playing', (e, playing) => {
            if (!!playing !== this.state.playing) {
                this.setState({ playing: !!playing });
            }
        });

        ipc.on('coverUrl', (e, url) => {
            if (url !== this.state.src) {
                this.setState({ artWorkSrc: url });
            }
        });

        ipc.on('position', (e, percent) => {
            this.setState({ progress: percent });
        });

        ipc.on('trackInfo', (e, trackInfo) => {
            if (trackInfo.song !== this.state.trackInfo.song) {
                this.setState({ trackInfo });
            }
        });

        ipc.on('repeat', (e, repeating) => {
            if (repeating !== this.state.repeating) {
                this.setState({ repeating });
            }
        });

        ipc.on('shuffle', (e, shuffling) => {
            if (shuffling !== this.state.shuffling) {
                this.setState({ shuffling });
            }
        });
        const { access_token = false } = store.get('tokens') || {};
        if (access_token) this.setState({ requireAuth: false });
    }

    clearLoading() {
        this.setState({ loading: false });
    }

    render() {
        const {
            playing,
            repeating,
            shuffling,
            artWorkSrc,
            loading,
            progress,
            trackInfo,
            requireAuth,
        } = this.state;

        if (requireAuth) return <Login />;

        return (
            <Wrapper image={artWorkSrc}>
                <ArtWork src={artWorkSrc} onLoad={this.clearLoading} />
                {loading && <Loading {...loading} />}
                <TrackInfo trackInfo={trackInfo} />
                <ProgressBar progress={progress} />
                <ControlBar
                    playing={playing}
                    repeating={repeating}
                    shuffling={shuffling}
                />
            </Wrapper>
        );
    }
}

render(<Main />, document.getElementById('main'));
