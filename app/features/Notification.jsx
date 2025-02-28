// app/features/Notification.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

const Notification = ({ 
  type = NOTIFICATION_TYPES.INFO, 
  message, 
  details,
  autoClose = true,
  duration = 5000,
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer;
    if (autoClose && visible) {
      timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoClose, duration, visible, onClose]);

  // If not visible anymore, don't render
  if (!visible) return null;

  // Determine styles based on type
  const getStyles = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return {
          container: 'bg-green-50 border-green-500',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        };
      case NOTIFICATION_TYPES.ERROR:
        return {
          container: 'bg-red-50 border-red-500',
          text: 'text-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />
        };
      case NOTIFICATION_TYPES.WARNING:
        return {
          container: 'bg-yellow-50 border-yellow-500',
          text: 'text-yellow-800',
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />
        };
      case NOTIFICATION_TYPES.INFO:
      default:
        return {
          container: 'bg-blue-50 border-blue-500',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-500" />
        };
    }
  };

  const styles = getStyles();

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div className={`${styles.container} border-l-4 p-4 rounded shadow-sm mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {styles.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
          {details && (
            <p className={`mt-1 text-sm ${styles.text} opacity-75`}>{details}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const NotificationContainer = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          details={notification.details}
          autoClose={notification.autoClose}
          duration={notification.duration}
          onClose={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
};

export { Notification, NotificationContainer, NOTIFICATION_TYPES };