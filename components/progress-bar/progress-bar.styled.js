import styled from 'styled-components';

export const Main = styled.div`
    display: flex;
    justify-content: center;
    padding: 10px;
`;

export const Bar = styled.div`
    background: rgba(255, 255, 255, 0.3);
    width: 100%;
    height: 2px;
    border-radius: 2px;
`;

export const Progress = styled.div`
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
