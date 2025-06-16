import { useEffect, useState } from 'react';
import api from '../../../api/axiosConfig';
import styles from './MyFlats.module.css';
import FlatView from '../FlatView/FlatView';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../Auth/Auth';
import { useToast } from '../../Context/ToastContext/ToastContext';
import MessageNotificationBadge from '../../MessageNotificationBadge/MessageNotificationBadge';

const MyFlats = () => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFlat, setEditingFlat] = useState(null);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();

  const fetchMyFlats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the dedicated endpoint for user's own flats
      const response = await api.get('/flats/my-flats', {
        withCredentials: true,
      });

      let userFlats = [];
      if (response.data.data && Array.isArray(response.data.data)) {
        userFlats = response.data.data;
      } else if (Array.isArray(response.data)) {
        userFlats = response.data;
      } else {
        userFlats = [];
      }
      setFlats(userFlats);

    } catch {
      setError('Failed to load your flats');
      addToast('Failed to load your flats', 'error');
      setFlats([]); // Ensure flats is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyFlats();
    }
  }, [user]);

  const handleStartEdit = (flat) => {
    setEditingFlat({
      ...flat,
      editedValues: {
        ...flat,
        // Ensure all required fields are present
        flatName: flat.flatName || '',
        city: flat.city || '',
        streetName: flat.streetName || '',
        streetNumber: flat.streetNumber || '',
        areaSize: flat.areaSize || '',
        rentPrice: flat.rentPrice || '',
        yearBuilt: flat.yearBuilt || '',
        hasAC: flat.hasAC || false,
        dateAvailable: flat.dateAvailable ? flat.dateAvailable.split('T')[0] : ''
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditingFlat(prev => ({
      ...prev,
      editedValues: {
        ...prev.editedValues,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const validateForm = (data) => {
    const errors = {};

    if (!data.city || data.city.trim().length === 0) {
      errors.city = 'City is required';
    }

    if (!data.streetName || data.streetName.trim().length === 0) {
      errors.streetName = 'Street name is required';
    }

    if (!data.streetNumber || data.streetNumber < 1) {
      errors.streetNumber = 'Street number must be at least 1';
    }

    if (!data.areaSize || data.areaSize < 1) {
      errors.areaSize = 'Area size must be at least 1';
    }

    if (!data.rentPrice || data.rentPrice < 100) {
      errors.rentPrice = 'Rent price must be at least 100';
    }

    if (!data.yearBuilt || data.yearBuilt < 1900 || data.yearBuilt > new Date().getFullYear()) {
      errors.yearBuilt = 'Please enter a valid year between 1900 and current year';
    }

    return errors;
  };

  const handleSave = async (flatId) => {
    if (saving) return;

    try {
      setSaving(true);

      const updatedData = { ...editingFlat.editedValues };

      // Validate the form data
      const validationErrors = validateForm(updatedData);
      if (Object.keys(validationErrors).length > 0) {
        const errorMessages = Object.values(validationErrors).join(', ');
        addToast(`Validation errors: ${errorMessages}`, 'error');
        return;
      }

      // Clean up the data - remove fields that shouldn't be sent
      delete updatedData._id;
      delete updatedData.owner;
      delete updatedData.createdAt;
      delete updatedData.updatedAt;
      delete updatedData.__v;
      delete updatedData.ownerId; // Don't change ownership
      delete updatedData.imageUrl; // Don't try to update image URL through this method

      // Convert strings to numbers where needed and ensure they're valid
      if (updatedData.streetNumber) {
        updatedData.streetNumber = parseInt(updatedData.streetNumber, 10);
      }
      if (updatedData.areaSize) {
        updatedData.areaSize = parseInt(updatedData.areaSize, 10);
      }
      if (updatedData.rentPrice) {
        updatedData.rentPrice = parseInt(updatedData.rentPrice, 10);
      }
      if (updatedData.yearBuilt) {
        updatedData.yearBuilt = parseInt(updatedData.yearBuilt, 10);
      }

      
      // Handle date properly
      if (updatedData.dateAvailable) {
        // Check if it's a valid date
        const dateValue = new Date(updatedData.dateAvailable);
        if (isNaN(dateValue.getTime())) {
          delete updatedData.dateAvailable;
        }
      }

      // Ensure required fields are present and valid
      const requiredFields = ['city', 'streetName', 'streetNumber', 'areaSize', 'rentPrice', 'yearBuilt'];
      for (const field of requiredFields) {
        if (!updatedData[field] || (typeof updatedData[field] === 'string' && updatedData[field].trim() === '')) {
          addToast(`${field} is required and cannot be empty`, 'error');
          return;
        }
      }

      const response = await api.patch(
        `/flats/${flatId}`,
        updatedData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the local state with the response data (not our sent data)
      const updatedFlat = response.data.updatedFlat || response.data;
      setFlats(prev => prev.map(flat =>
        flat._id === flatId ? { ...flat, ...updatedFlat } : flat
      ));

      setEditingFlat(null);
      addToast('Flat updated successfully', 'success');

    } catch (error) {

      // Handle detailed validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err =>
          typeof err === 'string' ? err : err.message || err.field
        ).join(', ');
        addToast(`Validation errors: ${errorMessages}`, 'error');
      } else if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        const errorMessages = error.response.data.details.join(', ');
        addToast(`Validation errors: ${errorMessages}`, 'error');
      } else {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to update flat';
        addToast(errorMessage, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingFlat(null);
  };

  const handleDelete = async (flatId) => {
    if (!window.confirm('Are you sure you want to delete this flat?')) return;

    try {
      await api.delete(`/flats/${flatId}`, {
        withCredentials: true,
      });
      setFlats(prev => prev.filter(flat => flat._id !== flatId));
      addToast('Flat deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete flat';
      addToast(errorMessage, 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) return <div className={styles.container}><p>Loading your flats...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.error}>{error}</p></div>;

  // Ensure flats is always an array before rendering
  const flatsArray = Array.isArray(flats) ? flats : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Flats</h1>
      <p className={styles.subtitle}>You have {flatsArray.length} flat{flatsArray.length !== 1 ? 's' : ''} listed</p>

      {flatsArray.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't added any flats yet.</p>
          <p>Click "Add Flat" to list your first property!</p>
        </div>
      ) : (
        <div className={styles.flatsGrid}>
          {flatsArray.map((flat) => (
            <div key={flat._id} className={styles.flatCard}>
              {editingFlat?._id === flat._id ? (
                <div className={styles.editForm}>
                  {/* Add Flat Name field */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`flatName-${flat._id}`} className={styles.formLabel}>Flat Name:</label>
                    <input
                      id={`flatName-${flat._id}`}
                      type="text"
                      name="flatName"
                      value={editingFlat.editedValues.flatName || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter flat name"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`city-${flat._id}`} className={styles.formLabel}>City:</label>
                    <input
                      id={`city-${flat._id}`}
                      type="text"
                      name="city"
                      value={editingFlat.editedValues.city || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`streetName-${flat._id}`} className={styles.formLabel}>Street Name:</label>
                    <input
                      id={`streetName-${flat._id}`}
                      type="text"
                      name="streetName"
                      value={editingFlat.editedValues.streetName || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter street name"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`streetNumber-${flat._id}`} className={styles.formLabel}>Street Number:</label>
                    <input
                      id={`streetNumber-${flat._id}`}
                      type="number"
                      name="streetNumber"
                      value={editingFlat.editedValues.streetNumber || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter street number"
                      min="1"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`areaSize-${flat._id}`} className={styles.formLabel}>Area Size (m²):</label>
                    <input
                      id={`areaSize-${flat._id}`}
                      type="number"
                      name="areaSize"
                      value={editingFlat.editedValues.areaSize || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter area size in m²"
                      min="1"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`rentPrice-${flat._id}`} className={styles.formLabel}>Rent Price ($):</label>
                    <input
                      id={`rentPrice-${flat._id}`}
                      type="number"
                      name="rentPrice"
                      value={editingFlat.editedValues.rentPrice || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter rent price in $"
                      min="100"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`yearBuilt-${flat._id}`} className={styles.formLabel}>Year Built:</label>
                    <input
                      id={`yearBuilt-${flat._id}`}
                      type="number"
                      name="yearBuilt"
                      value={editingFlat.editedValues.yearBuilt || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      placeholder="Enter year built"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor={`dateAvailable-${flat._id}`} className={styles.formLabel}>Date Available:</label>
                    <input
                      id={`dateAvailable-${flat._id}`}
                      type="date"
                      name="dateAvailable"
                      value={editingFlat.editedValues.dateAvailable || ''}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      id={`hasAC-${flat._id}`}
                      name="hasAC"
                      checked={editingFlat.editedValues.hasAC || false}
                      onChange={handleInputChange}
                      className={styles.checkbox}
                    />
                    <label htmlFor={`hasAC-${flat._id}`} className={styles.checkboxLabel}>
                      Has Air Conditioning
                    </label>
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      onClick={() => handleSave(flat._id)}
                      className={styles.saveButton}
                      disabled={saving}
                    >
                      <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={styles.cancelButton}
                      disabled={saving}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.imageContainer}>
                    {/* 🔔 Owner Notification Badge - Show for property owners */}
                    <MessageNotificationBadge 
                      flat={flat} 
                      showForOwner={true}
                    />
                    
                    {flat.imageUrl && (
                      <img
                        src={flat.imageUrl}
                        alt={`Flat in ${flat.city}`}
                        className={styles.flatImage}
                      />
                    )}
                  </div>
                  
                  <div className={styles.flatContent}>
                    <h2 className={styles.flatTitle}>
                      {flat.flatName || `${flat.city}, ${flat.streetName} ${flat.streetNumber}`}
                    </h2>

                    <div className={styles.flatDetails}>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Location:</span>
                        <span>{flat.city}, {flat.streetName} {flat.streetNumber}</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Area:</span>
                        <span>{flat.areaSize} m²</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Year Built:</span>
                        <span>{flat.yearBuilt}</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Rent:</span>
                        <span>${flat.rentPrice?.toLocaleString()}/month</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>AC:</span>
                        <span>{flat.hasAC ? "Yes" : "No"}</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Available:</span>
                        <span>{formatDate(flat.dateAvailable)}</span>
                      </div>
                    </div>

                    <div className={styles.listingDate}>
                      Listed on: {formatDate(flat.createdAt)}
                    </div>

                    <div className={styles.cardActions}>
                      <FlatView flat={flat} />
                      <button
                        onClick={() => handleStartEdit(flat)}
                        className={styles.editButton}
                        disabled={saving}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(flat._id)}
                        className={styles.deleteButton}
                        disabled={saving}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFlats;