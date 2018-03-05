import React from 'react';

import { Main, Heading, Message } from './loading.styled';

const Loading = ({ heading, message }) => (
    <Main>
        <Heading>{heading}</Heading>
        <Message>{message}</Message>
    </Main>
);

export default Loading;
