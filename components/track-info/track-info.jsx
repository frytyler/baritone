import React from 'react';

import { Main, Song, Artist } from './track-info.styled';

const TrackInfo = ({ trackInfo: { song, artist } }) => (
    <Main>
        <Song>{song}</Song>
        <Artist>{artist}</Artist>
    </Main>
);

export default TrackInfo;
