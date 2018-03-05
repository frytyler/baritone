import styled from 'styled-components';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {
    faRandom,
    faStepBackward,
    faStepForward,
    faRetweet,
} from '@fortawesome/fontawesome-free-solid';

export const Main = styled.div`
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

const BaseIcon = styled(FontAwesomeIcon)`
    cursor: pointer;
`;

export const Shuffle = BaseIcon.extend`
    margin-top: 8px;
    font-size: 14px !important;
    color: ${({ active }) => (active ? '#23CF5F' : '#ffffff')};
`;
Shuffle.defaultProps = { icon: faRandom };

export const Previous = BaseIcon.extend`
    margin-top: 3px;
    font-size: 20px !important;
`;
Previous.defaultProps = { icon: faStepBackward };

export const Next = Previous.extend``;
Next.defaultProps = { icon: faStepForward };

export const PausePlay = Previous.extend`
    border: 1px solid rgba(255, 255, 255, 0.8);
    padding: 20px;
    border-radius: 50%;
    font-size: 36px;
`;

export const Repeat = BaseIcon.extend`
    margin-top: 8px;
    font-size: 14px !important;
    color: ${({ active }) => (active ? '#23CF5F' : '#ffffff')};
`;
Repeat.defaultProps = { icon: faRetweet };
