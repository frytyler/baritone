import React from 'react';

import styled from 'styled-components';

const LoginButton = styled.a``;

const Login = () => {
    return (
        <div>
            <LoginButton href="http://localhost:3000/login">
                Please log in
            </LoginButton>
        </div>
    );
};

export default Login;
