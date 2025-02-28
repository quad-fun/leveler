// app/context/NotificationContext.js
'use client';

import React, { createContext, useState, useContext, useCallback } from 'react';
import { NotificationContainer, NOTIFICATION_TYPES } from '../features/Notification';

// Create context
const NotificationContext = createContext();

// Generate unique ID for each notification
const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a notification
  const addNotification = useCallback((message, options = {}) => {
    const id = generateId();
    const notification = {
      id,
      message,
      type: options.type || NOTIFICATION_TYPES.INFO,
      details: options.details || '',
      autoClose: options.autoClose !== undefined ? options.autoClose : true,
      duration: options.duration || 5000,
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  // Shorthand methods for different notification types
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: NOTIFICATION_TYPES.SUCCESS });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: NOTIFICATION_TYPES.ERROR });
  }, [addNotification]);
  
  const showInfo = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: NOTIFICATION_TYPES.INFO });
  }, [addNotification]);
  
  const showWarning = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: NOTIFICATION_TYPES.WARNING });
  }, [addNotification]);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue = {
    notifications,
    addNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeNotification,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onDismiss={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};