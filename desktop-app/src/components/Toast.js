import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
`;

const ToastItem = styled.div`
  background-color: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'error': return props.theme.colors.danger;
      case 'warning': return props.theme.colors.warning;
      case 'info': return props.theme.colors.info;
      default: return props.theme.colors.primary;
    }
  }};
  border-radius: ${props => props.theme.borderRadius};
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 300px;
`;

const ToastIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  
  color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'error': return props.theme.colors.danger;
      case 'warning': return props.theme.colors.warning;
      case 'info': return props.theme.colors.info;
      default: return props.theme.colors.primary;
    }
  }};
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const ToastMessage = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.4;
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: ${props => props.theme.colors.border};
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: ${props => {
      switch (props.type) {
        case 'success': return props.theme.colors.success;
        case 'error': return props.theme.colors.danger;
        case 'warning': return props.theme.colors.warning;
        case 'info': return props.theme.colors.info;
        default: return props.theme.colors.primary;
      }
    }};
    width: 100%;
    animation: progress ${props => props.duration}ms linear;
  }
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, isExiting: true } : toast
    ));
    
    // Remove from array after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
    custom: (config) => addToast(config)
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheck size={16} />;
      case 'error': return <FiX size={16} />;
      case 'warning': return <FiAlertTriangle size={16} />;
      case 'info': return <FiInfo size={16} />;
      default: return <FiInfo size={16} />;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            type={toast.type}
            isExiting={toast.isExiting}
          >
            <ToastIcon type={toast.type}>
              {getIcon(toast.type)}
            </ToastIcon>
            <ToastContent>
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
            </ToastContent>
            <ToastClose onClick={() => removeToast(toast.id)}>
              <FiX size={14} />
            </ToastClose>
            {toast.duration > 0 && (
              <ProgressBar type={toast.type} duration={toast.duration} />
            )}
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
