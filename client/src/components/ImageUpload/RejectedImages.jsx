import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown, faChevronUp, faRedo, faCrop } from '@fortawesome/free-solid-svg-icons';
import './RejectedImages.css'

const RejectedPhotosSection = ({ 
  photos, 
  onRemovePhoto,
  onTryCrop,
  onTryAgain,
  goodPhotosCount = 7,
  title = "Some Photos Didn't Meet Our Guidelines",
  description = `Please ensure that the photos you upload are clear and well-lit. and follow the instructions provided.`,
  backgroundColor = "#fff5f5",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle section collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get action button based on rejection reason
  const getActionButton = (photo) => {
    if (photo.rejectionReason?.toLowerCase().includes('blurry')) {
      return (
        <button 
          className="try-again-button" 
          onClick={() => onTryAgain(photo.id)}
        >
          <FontAwesomeIcon icon={faRedo} className="button-icon" />
          <span>Try again</span>
        </button>
      );
    } else if (photo.rejectionReason?.toLowerCase().includes('too far')) {
      return (
        <button 
          className="crop-button" 
          onClick={() => onTryCrop(photo.id)}
        >
          <FontAwesomeIcon icon={faCrop} className="button-icon" />
          <span>Crop</span>
        </button>
      );
    }
    return null;
  };

  // Get detailed error message based on rejection reason
  const getDetailedErrorMessage = (reason) => {
    if (reason?.toLowerCase().includes('blurry')) {
      return "We detected a blurry face. Please ensure the face is in focus.";
    } else if (reason?.toLowerCase().includes('too far')) {
      return "Face is too far from the camera. Please ensure the face is at an appropriate distance.";
    }
    return null;
  };

  return (
    <div className="rejected-photos-section" style={{ backgroundColor }}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <button 
          className="collapse-button" 
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} />
        </button>
      </div>

      {!isCollapsed && (
        <>
          <p className="section-description">{description}</p>
          
          <div className="photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="rejected-photo-item">
                <div className="photo-container">
                  <img 
                    src={photo.previewUrl} 
                    alt={photo.alt || "Rejected photo"} 
                    className="photo-image" 
                  />
                  <button 
                    className="remove-button" 
                    onClick={() => onRemovePhoto(photo.id)}
                    aria-label="Remove photo"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>

                  {/* Error overlay for blurry photos */}
                  {photo.rejectionReason?.toLowerCase().includes('blurry') && (
                    <div className="error-overlay">
                      <div className="error-content">
                        {getActionButton(photo)}
                        <p className="error-message">{getDetailedErrorMessage(photo.rejectionReason)}</p>
                      </div>
                    </div>
                  )}

                  {/* Action button overlay for 'crop' */}
                  {photo.rejectionReason?.toLowerCase().includes('too far') && (
                    <div className="action-button-container">
                      {getActionButton(photo)}
                    </div>
                  )}
                </div>
                
                {/* Rejection reason label */}
                <div className="rejection-reason">
                  {photo.rejectionReason}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RejectedPhotosSection;