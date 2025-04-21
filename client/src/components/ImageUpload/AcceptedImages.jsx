// AcceptedPhotosSection.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown, faChevronUp, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './AcceptedPhotosSection.css';

const AcceptedPhotosSection = ({ 
  photos, 
  onRemovePhoto,
  title = "Accepted Photos",
  description = "These images passed our scoring test and will all be used to generate your AI photos.",
  backgroundColor = "#f1f8e9",
  showCarouselControls = true,
  itemsPerPage = 6
}) => {

    console.log(photos)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate total pages based on items per page
  const totalPages = Math.ceil(photos.length / itemsPerPage);
  
  // Get current photos to display based on pagination
  const currentPhotos = photos.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  // Navigate to next page
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Navigate to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Toggle section collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="photos-section" style={{ backgroundColor }}>
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
            {currentPhotos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img 
                  src={photo.previewUrl} 
                  alt={photo.alt || "Uploaded photo"} 
                  className="photo-image" 
                />
                <button 
                  className="remove-button" 
                  onClick={() => onRemovePhoto(photo.id)}
                  aria-label="Remove photo"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
          
          {showCarouselControls && totalPages > 1 && (
            <div className="carousel-controls">
              <button 
                className="carousel-button prev"
                onClick={prevPage}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <div className="pagination-indicator">
                {currentPage + 1} / {totalPages}
              </div>
              <button 
                className="carousel-button next"
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AcceptedPhotosSection;