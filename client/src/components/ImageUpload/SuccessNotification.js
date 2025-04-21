import React from "react";

const SuccessNotification = ({ onClose }) => {
  return (
    <div className="success-notification">
      <div className="notification-content">
        <span className="success-icon">✓</span>
        <span className="success-message">
          Your photos have been successfully uploaded!
        </span>
      </div>
      <button className="close-button" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default SuccessNotification;
