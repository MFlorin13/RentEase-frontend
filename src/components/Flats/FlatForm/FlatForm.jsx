import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import { useToast } from '../../Context/ToastContext/ToastContext';
import { ImageUpload } from '../../CommonComponents/ImageUpload';
import styles from './FlatForm.module.css';
import { FaSpinner } from 'react-icons/fa';

const FlatForm = ({ refreshList }) => {
  const [formData, setFormData] = useState({
    flatName: "",
    city: "",
    streetName: "",
    streetNumber: "",
    areaSize: "",
    hasAC: false,
    yearBuilt: "",
    rentPrice: "",
    dateAvailable: new Date().toISOString().split('T')[0],
  });

  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageSelect = (file) => {
    setImage(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.city) newErrors.city = 'City is required';
    if (!/^[A-Z]/.test(formData.city)) newErrors.city = 'City must start with a capital letter';

    if (!formData.streetName) newErrors.streetName = 'Street name is required';
    if (formData.streetName.length < 2) newErrors.streetName = 'Street name must have at least 2 characters';
    if (formData.streetName.length > 50) newErrors.streetName = 'Street name must have a maximum of 50 characters';

    if (!formData.streetNumber) newErrors.streetNumber = 'Street number is required';
    if (Number(formData.streetNumber) < 1) newErrors.streetNumber = 'Street number must be greater than or equal to 1';

    if (!formData.areaSize) newErrors.areaSize = 'Area size is required';
    if (Number(formData.areaSize) < 1) newErrors.areaSize = 'Area size must be at least 1 square meter';

    if (!formData.yearBuilt) newErrors.yearBuilt = 'Year built is required';
    if (Number(formData.yearBuilt) < 1900) newErrors.yearBuilt = 'Year built must be greater than or equal to 1900';
    if (Number(formData.yearBuilt) > new Date().getFullYear()) newErrors.yearBuilt = 'Year built cannot be in the future';

    if (!formData.rentPrice) newErrors.rentPrice = 'Rent price is required';
    if (Number(formData.rentPrice) < 100) newErrors.rentPrice = 'Rent price must be at least 100 units';

    if (!formData.dateAvailable) newErrors.dateAvailable = 'Date available is required';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    // Validate the form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      addToast('Please fix the errors in the form', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData for the request
      const flatData = new FormData();

      // IMPORTANT: Use the correct field names that match your backend model
      flatData.append('flatName', formData.flatName || `${formData.city} Apartment`); // Always include flatName
      flatData.append('city', formData.city);
      flatData.append('streetName', formData.streetName);
      flatData.append('streetNumber', formData.streetNumber);
      flatData.append('areaSize', formData.areaSize);
      flatData.append('hasAC', formData.hasAC);
      flatData.append('yearBuilt', formData.yearBuilt);
      flatData.append('rentPrice', formData.rentPrice);
      flatData.append('dateAvailable', formData.dateAvailable);

      // Add image if exists
      if (image) {
        flatData.append('image', image);
      }

      // Send request to backend
      await api.post('/flats', flatData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        },
      });

      addToast('Flat added successfully!', 'success');
      if (refreshList) refreshList();
      navigate('/');

    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          'Error adding flat. Please try again.';
        addToast(errorMessage, 'error');
      } else if (error.request) {
        addToast('No response from server. Please try again later.', 'error');
      } else {
        addToast('Error creating request. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Flat Name</label>
        <input
          type="text"
          name="flatName"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          placeholder="Enter flat name"
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
          placeholder="Enter city (must start with capital letter)"
        />
        {errors.city && <span className={styles.error}>{errors.city}</span>}
      </div>

      <div className={styles.inputGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Street Name</label>
          <input
            type="text"
            name="streetName"
            value={formData.streetName}
            onChange={handleChange}
            className={`${styles.input} ${errors.streetName ? styles.inputError : ''}`}
            placeholder="Enter street name"
          />
          {errors.streetName && <span className={styles.error}>{errors.streetName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Street Number</label>
          <input
            type="number"
            name="streetNumber"
            value={formData.streetNumber}
            onChange={handleChange}
            min="1"
            step="1"
            className={`${styles.input} ${errors.streetNumber ? styles.inputError : ''}`}
            placeholder="Enter street number"
          />
          {errors.streetNumber && <span className={styles.error}>{errors.streetNumber}</span>}
        </div>
      </div>

      <div className={styles.inputGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Area Size (m²)</label>
          <input
            type="number"
            name="areaSize"
            value={formData.areaSize}
            onChange={handleChange}
            min="1"
            step="1"
            className={`${styles.input} ${errors.areaSize ? styles.inputError : ''}`}
            placeholder="Enter area size"
          />
          {errors.areaSize && <span className={styles.error}>{errors.areaSize}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Rent Price ($)</label>
          <input
            type="number"
            name="rentPrice"
            value={formData.rentPrice}
            onChange={handleChange}
            min="100"
            step="1"
            className={`${styles.input} ${errors.rentPrice ? styles.inputError : ''}`}
            placeholder="Enter rent price"
          />
          {errors.rentPrice && <span className={styles.error}>{errors.rentPrice}</span>}
        </div>
      </div>

      <div className={styles.inputGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Year Built</label>
          <input
            type="number"
            name="yearBuilt"
            value={formData.yearBuilt}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear()}
            step="1"
            className={`${styles.input} ${errors.yearBuilt ? styles.inputError : ''}`}
            placeholder="Enter year built"
          />
          {errors.yearBuilt && <span className={styles.error}>{errors.yearBuilt}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Date Available</label>
          <input
            type="date"
            name="dateAvailable"
            value={formData.dateAvailable}
            onChange={handleChange}
            className={`${styles.input} ${errors.dateAvailable ? styles.inputError : ''}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.dateAvailable && <span className={styles.error}>{errors.dateAvailable}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            name="hasAC"
            checked={formData.hasAC}
            onChange={handleChange}
            className={styles.checkbox}
            id="hasAC"
          />
          <label htmlFor="hasAC" className={styles.label}>Has Air Conditioning</label>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Property Image</label>
        <div className={styles.imageSection}>
          <ImageUpload onImageSelect={handleImageSelect} currentImage={null} />
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className={styles.loadingSpinner} />
              Adding Flat...
            </>
          ) : (
            'Add Flat'
          )}
        </button>
      </div>
    </form>
  );
};

export default FlatForm;