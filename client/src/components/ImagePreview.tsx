import React from "react";
import TrashIcon from "./icons/TransIcon";

const ImagePreview = ({
  image,
  onRemove,
  isRejected = false,
  rejectionReason,
  onTryCrop,
  key
}) => {
  return (
    <div className={`image-preview ${isRejected ? "rejected" : ""}`}>
      <img src={image.previewUrl} alt={image.name} />

      <button className="remove-button" onClick={onRemove}>
        <TrashIcon />
      </button>

      {isRejected && (
        <div className="rejection-info">
          {onTryCrop && (
            <div className="crop-suggestion">
              <button className="crop-button" onClick={onTryCrop}>
                ↺ Crop
              </button>
              <p className="crop-message">
                Face is too far from the camera. Please ensure the face is at a
                appropriate distance.
              </p>
            </div>
          )}
          <p className="rejection-reason">{rejectionReason}</p>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;
