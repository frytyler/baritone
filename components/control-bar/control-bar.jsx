import React from 'react';
import { ipcRenderer as ipc } from 'electron';

import { faPlay, faPause } from '@fortawesome/fontawesome-free-solid';
import {
    Main,
    Shuffle,
    Previous,
    PausePlay,
    Next,
    Repeat,
} from './control-bar.styled';

class ControlBar extends React.Component {
    render() {
        const { shuffling, repeating, playing } = this.props;

        return (
            <Main>
                <Shuffle
                    active={shuffling}
                    onClick={() => ipc.send('shuffle', !shuffling)}
                />
                <Previous onClick={() => ipc.send('skip', false)} />
                <PausePlay
                    icon={playing ? faPause : faPlay}
                    onClick={() => ipc.send('playpause', null)}
                />
                <Next onClick={() => ipc.send('skip', true)} />
                <Repeat
                    active={repeating}
                    onClick={() => ipc.send('repeat', !repeating)}
                />
            </Main>
        );
    }
}

ControlBar.defaultProps = {
    shuffling: false,
    repeating: false,
    playing: false,
};

export default ControlBar;
