import styled from 'styled-components';

export const Wrapper = styled.div`
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
