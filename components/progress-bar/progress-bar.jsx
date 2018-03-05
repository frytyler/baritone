import React from 'react';

import { Main, Bar, Progress } from './progress-bar.styled';

const ProgressBar = ({ progress = 0 }) => (
    <Main>
        <Bar>
            <Progress progress={progress} />
        </Bar>
    </Main>
);

export default ProgressBar;
