import React from 'react';

const ImageThumbnail = ({ image, onRemove, isRejected = false }) => {
  return (
    <div className={`image-thumbnail ${isRejected ? 'rejected' : ''}`}>
      <img src={image.previewUrl} alt="Uploaded" />
      <button 
        className="remove-button" 
        onClick={onRemove}
        aria-label="Remove image"
      >
        <span className="trash-icon">🗑</span>
      </button>
    </div>
  );
};

export default ImageThumbnail;