import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './CollapsibleSection.css';

const CollapsibleSection = ({
  title,
  icon,
  iconColor,
  backgroundColor,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`collapsible-section ${className}`} 
      style={{ backgroundColor }}
    >
      <div className="section-header" onClick={toggleExpanded}>
        <div className="header-left">
          {icon && (
            <span className="section-icon" style={{ color: iconColor }}>
              <FontAwesomeIcon icon={icon} />
            </span>
          )}
          <h3 className="section-title">{title}</h3>
        </div>
        <button 
          className="toggle-button"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          aria-expanded={isExpanded}
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
};

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.object,
  iconColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  children: PropTypes.node,
  defaultExpanded: PropTypes.bool,
  className: PropTypes.string,
};

export default CollapsibleSection;