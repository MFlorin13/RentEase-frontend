import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye } from 'lucide-react';
import styles from './FlatView.module.css';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalRoot}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modalContainer}>
        {children}
      </div>
    </div>,
    document.body
  );
};

const FlatViewButton = ({ flat, onView }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    if (onView) onView(flat);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Format price helper
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Not specified';
    return `€${Number(price).toLocaleString()}`;
  };

  return (
    <>
      <button
        onClick={handleViewClick}
        className={styles.viewButton}
      >
        <Eye size={18} />
        View Details
      </button>

      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{flat.flatName || flat.name || 'Property Details'}</h2>
            <button
              onClick={handleClose}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>

          {flat.imageUrl && (
            <div className={styles.imageContainer}>
              <img
                src={flat.imageUrl}
                alt={flat.flatName || flat.name || 'Property'}
                className={styles.flatImage}
              />
            </div>
          )}

          <div className={styles.detailsContainer}>
            {/* Location Section */}
            <div className={styles.locationAlert}>
              <h3 className={styles.locationTitle}>Location</h3>
              <p className={styles.locationText}>
                {flat.city && flat.streetName && flat.streetNumber 
                  ? `${flat.city}, ${flat.streetName} ${flat.streetNumber}`
                  : [flat.city, flat.streetName, flat.streetNumber].filter(Boolean).join(', ') || 'Location not specified'
                }
              </p>
            </div>

            {/* Basic Information */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Property Name</div>
                <div className={styles.detailValue}>{flat.flatName || 'Not specified'}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Monthly Rent</div>
                <div className={styles.detailValue}>{formatPrice(flat.rentPrice)}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Area Size</div>
                <div className={styles.detailValue}>
                  {flat.areaSize ? `${flat.areaSize} m²` : 'Not specified'}
                </div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Year Built</div>
                <div className={styles.detailValue}>{flat.yearBuilt || 'Not specified'}</div>
              </div>
            </div>

            {/* Address Details */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>City</div>
                <div className={styles.detailValue}>{flat.city || 'Not specified'}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Street Name</div>
                <div className={styles.detailValue}>{flat.streetName || 'Not specified'}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Street Number</div>
                <div className={styles.detailValue}>{flat.streetNumber || 'Not specified'}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Air Conditioning</div>
                <div className={styles.detailValue}>
                  {flat.hasAC !== undefined ? (flat.hasAC ? "Yes" : "No") : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Availability & Dates */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Available From</div>
                <div className={styles.detailValue}>{formatDate(flat.dateAvailable)}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Listed On</div>
                <div className={styles.detailValue}>{formatDate(flat.createdAt)}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Last Updated</div>
                <div className={styles.detailValue}>{formatDate(flat.updatedAt)}</div>
              </div>
              <div className={styles.detailCard}>
                <div className={styles.detailLabel}>Property ID</div>
                <div className={styles.detailValue}>
                  {flat._id ? flat._id.slice(-8).toUpperCase() : 'Not available'}
                </div>
              </div>
            </div>

            {/* Additional Attributes (for any extra fields) */}
            {Object.entries(flat).filter(([key, value]) => 
              !['_id', '__v', 'flatName', 'city', 'streetName', 'streetNumber', 
                'areaSize', 'yearBuilt', 'rentPrice', 'hasAC', 'dateAvailable', 
                'createdAt', 'updatedAt', 'imageUrl', 'ownerId', 'owner', 'name'].includes(key) &&
              value !== null && 
              value !== undefined && 
              value !== '' &&
              typeof value !== 'object'
            ).length > 0 && (
              <>
                <div className={styles.locationAlert}>
                  <h3 className={styles.locationTitle}>Additional Information</h3>
                </div>
                <div className={styles.detailsGrid}>
                  {Object.entries(flat)
                    .filter(([key, value]) => 
                      !['_id', '__v', 'flatName', 'city', 'streetName', 'streetNumber', 
                        'areaSize', 'yearBuilt', 'rentPrice', 'hasAC', 'dateAvailable', 
                        'createdAt', 'updatedAt', 'imageUrl', 'ownerId', 'owner', 'name'].includes(key) &&
                      value !== null && 
                      value !== undefined && 
                      value !== '' &&
                      typeof value !== 'object'
                    )
                    .map(([key, value]) => (
                      <div key={key} className={styles.detailCard}>
                        <div className={styles.detailLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div className={styles.detailValue}>
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            <div className={styles.modalFooter}>
              <button
                onClick={handleClose}
                className={styles.closeModalButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FlatViewButton;