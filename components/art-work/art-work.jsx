import React from 'react';

import { Main, Image } from './art-work.styled';

const ArtWork = ({ src, onLoad }) => (
    <Main>
        <Image src={src} onLoad={onLoad} />
    </Main>
);

export default ArtWork;
