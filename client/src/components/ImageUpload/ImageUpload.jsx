import React, { useState, useRef, useEffect } from 'react';
import './ImageUpload.css';
import UploadingButton from './UploadingButton';

import AcceptedPhotosSection from './AcceptedImages';
import RejectedPhotosSection from './RejectedImages';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationTriangle, faInfo, faTimes } from '@fortawesome/free-solid-svg-icons';
import CollapsibleSection from '../CollapsibleSection';
import { validateImage } from '../../utils/imagevalidation';

// Import our custom hooks
import { useUser } from '../../context/UserContext';
import { useBatch } from '../../hooks/useBatch';
import { useImageUpload } from '../../hooks/useImageUpload';

const ImageUpload = () => {
  const { user, isAuthenticated } = useUser();
  const { batch, batchError, batchLoading, createNewBatch } = useBatch();
  const { 
    uploadedImages, 
    uploadError, 
    isUploading, 
    uploadMultipleImages, 
    removeImage, 
    softDeleteImage 
  } = useImageUpload();
  
  const fileInputRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [initError, setInitError] = useState(null);
  
  const minRequiredImages = 6;
  const maxAllowedImages = 10;
  
  const validImages = uploadedImages.filter(img => img.status === 'processed');
  const rejectedImages = uploadedImages.filter(img => img.status === 'rejected');
  const uploadedCount = validImages.length;

  // // Create or get batch on initial load
  useEffect(() => {
    // This would normally check if the user is authenticated,
    // but for demo purposes, we'll create a batch even without auth
    const initializeBatch = async () => {
      if (!batch && !batchLoading && !batchError) {
        // If this was a real app, we'd check for the user
        // For demo, we'll use a fixed user ID
        const userId = user?.id || 'demo-user-123';
        
        try {
          await createNewBatch('Image Upload Batch', 'Images for demo application', userId);
          // alert('Batch created successfully!');
        } catch (error) {
          console.error('Failed to create batch:', error);
          setInitError('Failed to create batch. Please try again.');
        }
      }
    };
    
    initializeBatch();
  }, [batch, batchLoading, createNewBatch, user, batchError]);

  // Handle file select through input
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!files.length) return;
    
    // Client-side validation before uploading
    const validFiles = [];
    const invalidFiles = [];
    
    // Validate each file on the client side first
    for (const file of files) {
      const result = validateImage(file);
      console.log('Validation result:', result);
      if (result.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          name: file.name,
          reason: result.reason
        });
      }
    }
    
    // Show status message for invalid files
    if (invalidFiles.length > 0) {
      setStatusMessage(`${invalidFiles.length} files failed validation and were not uploaded.`);
      setTimeout(() => {
        setStatusMessage('');
      }, 5000);
    }

    console.log('Valid files:', validFiles);
    console.log('Invalid files:', invalidFiles);
    
    // Only proceed with valid files
    if (validFiles.length > 0 && batch) {
      try {
        await uploadMultipleImages(validFiles, batch.id);
      } catch (error) {
        console.error('Error uploading files:', error);
        setStatusMessage('Failed to upload files. Please try again.');
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length) {
      const dataTransfer = new DataTransfer();
      Array.from(droppedFiles).forEach(file => dataTransfer.items.add(file));
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: { files: dataTransfer.files } });
      }
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleRemoveImage = (imageId) => {
    removeImage(imageId);
  };
  
  // Handle cropping (simulated)
  const handleTryCrop = (imageId) => {
    // In a real app, this would open a cropping interface
    alert('Cropping would be implemented in a real app');
  };
  
  // Handle retry (simulated)
  const handleTryAgain = (imageId) => {
    // In a real app, this might allow re-uploading or re-processing
    alert('Retry would be implemented in a real app');
  };
  
  const canProceed = uploadedCount >= minRequiredImages;
  const uploadLimitReached = uploadedImages.length >= maxAllowedImages;

  // If batch is loading, show a loading message
  // if (batchLoading) {
  //   return <div className="loading-container">Initializing upload session...</div>;
  // }

  // If there's a batch error, show the error
  // if (batchError) {
  //   return <div className="error-container">Error: {batchError}</div>;
  // }

  return (
    <div className="image-upload-layout">
      {/* Left side - Upload interface */}
      <div className="upload-section">

        
        <div className="upload-logo">
          <span role="img" aria-label="upload icon" className="upload-icon">📷</span>
        </div>
        
        <h2 className="upload-title">Upload photos</h2>
        
        <p className="upload-instructions">
          Now the fun begins! Select at least {minRequiredImages} of your best photos. 
          Uploading a mix of close-ups, selfies and mid-range shots can help the AI better capture your face and body type.
        </p>
        
        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}
        
        <div 
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          {isUploading ? (
            <UploadingButton />
          ) : (
            <>
              <div className="upload-button">
                <span>Click to upload or drag and drop</span>
              </div>
              <p className="file-types">PNG, JPG, HEIC up to 120MB</p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".png,.jpg,.jpeg,.heic"
            multiple
            className="file-input"
            disabled={uploadLimitReached || isUploading}
          />
        </div>
        
        <p className="upload-time-notice">It can take up to 1 minute to upload</p>
        
        {/* File list with processing status */}
        <div className="file-list">
          {uploadedImages.map(image => (
            <div key={image.id} className="file-item">
              <div className="file-icon">
                <span role="img" aria-label="image">🖼️</span>
              </div>
              <div className="file-details">
                <span className="file-name">{image.name}</span>
                <div className="file-status">
                  {image.status === 'uploading' && (
                    <>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${image.progress}%` }}
                        ></div>
                      </div>
                      <span>{image.progress}%</span>
                    </>
                  )}
                  {image.status === 'processing' && <span>Processing...</span>}
                  {/* {image.status === 'processed' && <span className="status-success">✓ Processed</span>} */}
                  {/* {image.status === 'rejected' && <span className="status-error">✗ {image.rejectionReason}</span>} */}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {uploadError && (
          <div className="upload-error">
            Error: {uploadError}
          </div>
        )}
      </div>
      
      {/* Right side - Preview and validation results */}
      <div className="preview-section">
        <div className="header-info">
          <div className="section-title">Uploaded Images</div>
          <div className="progress-indicator">
            <span className="count">{uploadedCount}</span> of {maxAllowedImages}
          </div>
        </div>
        
        {/* Success message when enough images are successfully processed */}
        {canProceed && (
          <div className="success-message">
            <span className="check-icon">✓</span>
            Your photos have been successfully uploaded
          </div>
        )}
        
        {validImages && validImages.length ? 
          <AcceptedPhotosSection 
            photos={validImages} 
            onRemovePhoto={handleRemoveImage}
          /> 
          : null
        }
        
        {rejectedImages && rejectedImages.length ?  
          <RejectedPhotosSection 
            photos={rejectedImages} 
            onRemovePhoto={handleRemoveImage} 
            onTryCrop={handleTryCrop}
            onTryAgain={handleTryAgain}
            goodPhotosCount={validImages.length}
          /> 
          : null
        }

        <CollapsibleSection
          title="Photo Requirements"
          icon={faCheck}
          iconColor="#4CAF50"
          backgroundColor="#f1f8e9"
          defaultExpanded={false}
        >
          <div className="requirements-content">
            
            
            <ul className="checklist">
              <li>
                <FontAwesomeIcon icon={faCheck} className="checklist-icon good" />
                <span>Clear, well-lit images showing your face clearly</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faCheck} className="checklist-icon good" />
                <span>At least one close-up photo of your face</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faCheck} className="checklist-icon good" />
                <span>At least one full body or mid-range photo</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faCheck} className="checklist-icon good" />
                <span>Variety of expressions and angles</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faInfo} className="checklist-icon info" />
                <span>Higher quality photos will produce better results</span>
              </li>
            </ul>
          </div>
        </CollapsibleSection>
      
        {/* Photo Restrictions Section */}
        <CollapsibleSection
          title="Photo Restrictions"
          icon={faTimes}
          iconColor="#F44336"
          backgroundColor="#ffebee"
        >
          <div className="restrictions-content">
            {/* <p>Please avoid uploading photos with the following issues:</p> */}
            
            <ul className="checklist">
              <li>
                <FontAwesomeIcon icon={faTimes} className="checklist-icon bad" />
                <span>Group photos with multiple people</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faTimes} className="checklist-icon bad" />
                <span>Images where your face is covered or obscured</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faTimes} className="checklist-icon bad" />
                <span>Heavy filters or editing that significantly alters your appearance</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faExclamationTriangle} className="checklist-icon warning" />
                <span>Photos with sunglasses or other items that hide facial features</span>
              </li>
              <li>
                <FontAwesomeIcon icon={faExclamationTriangle} className="checklist-icon warning" />
                <span>Very small or low resolution images</span>
              </li>
            </ul>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default ImageUpload;