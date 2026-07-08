import React, { useEffect } from 'react';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`}>
      <span className="toast-icon">
        {type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className="toast-text">{message}</span>
      <button onClick={onClose} className="toast-close-btn" aria-label="Close message">
        &times;
      </button>
    </div>
  );
}
