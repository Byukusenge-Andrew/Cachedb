import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: ${props => props.inline ? 'inline-flex' : 'flex'};
  align-items: center;
  justify-content: center;
  ${props => !props.inline && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `}
`;

const Spinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.color || props.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SpinnerText = styled.div`
  margin-left: 12px;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
`;

const LoadingSpinner = ({ 
  size = '40px', 
  color, 
  text, 
  inline = false,
  overlay = false 
}) => {
  if (overlay) {
    return (
      <SpinnerContainer>
        <div>
          <Spinner size={size} color={color} />
          {text && <SpinnerText>{text}</SpinnerText>}
        </div>
      </SpinnerContainer>
    );
  }

  return (
    <SpinnerContainer inline={inline}>
      <Spinner size={size} color={color} />
      {text && <SpinnerText>{text}</SpinnerText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
