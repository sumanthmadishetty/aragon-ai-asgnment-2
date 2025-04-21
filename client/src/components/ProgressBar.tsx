import React from "react";

const ProgressBar = ({ progress }) => {
  return (
    <div className="upload-progress-bar">
      <div className="upload-progress-fill" style={{ width: `${progress}%` }}>
        {/* No text content here for a clean progress bar */}
      </div>
    </div>
  );
};

export default ProgressBar;
