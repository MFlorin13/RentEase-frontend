import { useEffect, useState } from 'react';
import api from '../../../api/axiosConfig';
import { FaHeart, FaRegHeart, FaSort, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { Search } from '../../CommonComponents/SearchComponent';
import { LoadingSpinner } from '../../CommonComponents/LoadingSpinner';
import { ErrorMessage } from '../../CommonComponents/ErrorMessage';
import { useFavorites } from '../../Context/FavoriteContext/FavoriteContext';
import { useToast } from '../../Context/ToastContext/ToastContext';
import { useAuth } from '../../Auth/Auth';
import { DEFAULT_FILTERS } from '../../Constants/FlatConstants';
import { applyFilters, sortFlats } from '../../Utils/FlatUtils';
import styles from './AllFlats.module.css';
import MessageButton from '../../MessageButton/MessageButton';
import MessageNotificationBadge from '../../MessageNotificationBadge/MessageNotificationBadge';

const AllFlats = () => {
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [editingFlat, setEditingFlat] = useState(null);

  const { favorites, toggleFavorite } = useFavorites();
  const { addToast } = useToast();
  const { isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    const fetchAllFlats = async () => {
      try {
        setLoading(true);

        const response = await api.get('http://localhost:3000/flats', {
          withCredentials: true,
        });

        let flatsData = [];
        if (response.data.Flats) {
          flatsData = response.data.Flats;
        } else if (Array.isArray(response.data)) {
          flatsData = response.data;
        } else {
          console.warn('Unexpected response format:', response.data);
          flatsData = [];
        }

        setFlats(Array.isArray(flatsData) ? flatsData : []);
        setFilteredFlats(Array.isArray(flatsData) ? flatsData : []);
      } catch (err) {
        console.error('Error fetching flats:', err);
        setError('Failed to load flats');
        setFlats([]);
        setFilteredFlats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFlats();
  }, []);

  useEffect(() => {
    if (!Array.isArray(flats)) {
      setFilteredFlats([]);
      return;
    }

    const filteredResults = applyFilters(flats, filters, searchQuery);
    setFilteredFlats(Array.isArray(filteredResults) ? filteredResults : []);
  }, [searchQuery, filters, flats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (flat) => {
    setEditingFlat({
      ...flat,
      editedValues: { ...flat },
    });
  };

  const handleDelete = async (flatId) => {
    if (!window.confirm('Are you sure you want to delete this flat?')) return;

    try {
      await api.delete(`http://localhost:3000/flats/${flatId}`, {
        withCredentials: true,
      });
      setFlats((prev) => prev.filter((flat) => flat._id !== flatId));
      setFilteredFlats((prev) => prev.filter((flat) => flat._id !== flatId));
      addToast('Flat deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting flat:', error);
      addToast('Failed to delete flat', 'error');
    }
  };

  const handleSave = async () => {
    try {
      const updatedData = { ...editingFlat.editedValues };

      // Remove fields that shouldn't be sent
      delete updatedData._id;
      delete updatedData.owner;
      delete updatedData.createdAt;
      delete updatedData.updatedAt;
      delete updatedData.__v;
      delete updatedData.ownerId;
      delete updatedData.imageUrl;

      // Convert strings to numbers
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

      const response = await api.patch(
        `http://localhost:3000/flats/${editingFlat._id}`,
        updatedData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const updatedFlat = response.data.updatedFlat || response.data;

      // Only update flats (not filteredFlats)
      setFlats(prev => prev.map(flat =>
        flat._id === editingFlat._id ? { ...flat, ...updatedFlat } : flat
      ));

      setEditingFlat(null);
      addToast('Flat updated successfully', 'success');

    } catch (error) {
      console.error('Error updating flat:', error);
      console.error('Server response:', error.response?.data);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update flat';
      addToast(errorMessage, 'error');
    }
  };

  const handleInputChange = (e, field) => {
    const { value, type, checked } = e.target;
    setEditingFlat((prev) => ({
      ...prev,
      editedValues: {
        ...prev.editedValues,
        [field]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    if (!Array.isArray(filteredFlats)) {
      return;
    }

    const sortedFlats = sortFlats(filteredFlats, key, direction);
    setFilteredFlats(Array.isArray(sortedFlats) ? sortedFlats : []);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const flatsToDisplay = Array.isArray(filteredFlats) ? filteredFlats : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Available Flats</h1>
        <p className={styles.subtitle}>
          Browse all flats from our community ({flatsToDisplay.length} available)
        </p>

        <div className={styles.filters}>
          <Search
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by city, street, or area size..."
          />

          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label>City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className={styles.filterInput}
                placeholder="Enter city"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Price Range ($)</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                  placeholder="Min"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                  placeholder="Max"
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label>Area Range (m²)</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  name="minArea"
                  value={filters.minArea}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                  placeholder="Min"
                />
                <input
                  type="number"
                  name="maxArea"
                  value={filters.maxArea}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sortButtons}>
          <button onClick={() => handleSort('city')} className={styles.sortButton}>
            Sort by City <FaSort />
          </button>
          <button onClick={() => handleSort('rentPrice')} className={styles.sortButton}>
            Sort by Price <FaSort />
          </button>
          <button onClick={() => handleSort('areaSize')} className={styles.sortButton}>
            Sort by Area <FaSort />
          </button>
          <button onClick={() => handleSort('yearBuilt')} className={styles.sortButton}>
            Sort by Year <FaSort />
          </button>
        </div>
      </div>

      {flatsToDisplay.length === 0 ? (
        <div className={styles.noResults}>
          {loading ? 'Loading flats...' : 'No flats match your search criteria.'}
        </div>
      ) : (
        <div className={styles.flatsGrid}>
          {flatsToDisplay.map((flat) => (
            <div key={flat._id} className={styles.flatCard}>
              {editingFlat?._id === flat._id ? (
                <div className={styles.editForm}>
                  <div className={styles.editGrid}>
                    <div className={styles.editField}>
                      <label>Flat Name:</label>
                      <input
                        type="text"
                        value={editingFlat.editedValues.flatName || ''}
                        onChange={(e) => handleInputChange(e, 'flatName')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>City:</label>
                      <input
                        type="text"
                        value={editingFlat.editedValues.city || ''}
                        onChange={(e) => handleInputChange(e, 'city')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>Street Name:</label>
                      <input
                        type="text"
                        value={editingFlat.editedValues.streetName || ''}
                        onChange={(e) => handleInputChange(e, 'streetName')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>Street Number:</label>
                      <input
                        type="number"
                        value={editingFlat.editedValues.streetNumber || ''}
                        onChange={(e) => handleInputChange(e, 'streetNumber')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>Area Size (m²):</label>
                      <input
                        type="number"
                        value={editingFlat.editedValues.areaSize || ''}
                        onChange={(e) => handleInputChange(e, 'areaSize')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>Rent Price ($):</label>
                      <input
                        type="number"
                        value={editingFlat.editedValues.rentPrice || ''}
                        onChange={(e) => handleInputChange(e, 'rentPrice')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label>Year Built:</label>
                      <input
                        type="number"
                        value={editingFlat.editedValues.yearBuilt || ''}
                        onChange={(e) => handleInputChange(e, 'yearBuilt')}
                        className={styles.editInput}
                      />
                    </div>

                    <div className={styles.editField}>
                      <label className={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          checked={editingFlat.editedValues.hasAC || false}
                          onChange={(e) => handleInputChange(e, 'hasAC')}
                          className={styles.checkbox}
                        />
                        Has AC
                      </label>
                    </div>
                  </div>

                  <div className={styles.buttonGroup}>
                    <button type="button" onClick={handleSave} className={styles.saveButton}>
                      <FaSave /> Save
                    </button>
                    <button type="button" onClick={() => setEditingFlat(null)} className={styles.cancelButton}>
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.imageContainer}>
                    {flat.imageUrl && (
                      <img
                        src={flat.imageUrl}
                        alt={`Flat in ${flat.city}`}
                        className={styles.flatImage}
                      />
                    )}

                    {/* 🔔 Client Notification Badge - Show for non-owners */}
                    <MessageNotificationBadge 
                      flat={flat} 
                      showForClient={true}
                    />

                    {/* Admin buttons positioned over image */}
                    {isAdmin && (
                      <div className={styles.adminButtons}>
                        <button
                          onClick={() => handleEdit(flat)}
                          className={styles.adminEditButton}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(flat._id)}
                          className={styles.adminDeleteButton}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}

                    {/* Favorite button */}
                    {isLoggedIn && (
                      <button
                        onClick={() => toggleFavorite(flat._id)}
                        className={styles.favoriteButton}
                        title={favorites[flat._id] ? "Remove from favorites" : "Add to favorites"}
                      >
                        {favorites[flat._id] ? (
                          <FaHeart className={styles.favoriteIcon} />
                        ) : (
                          <FaRegHeart className={styles.favoriteIconOutline} />
                        )}
                      </button>
                    )}
                  </div>

                  <div className={styles.flatContent}>
                    {/* Prominent flat title/name */}
                    <h2 className={styles.flatTitle}>
                      {flat.flatName || `${flat.city} Apartment`}
                    </h2>

                    <div className={styles.flatDetails}>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Location:</span>
                        <span className={styles.detailValue}>
                          {flat.city}, {flat.streetName} {flat.streetNumber}
                        </span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Area:</span>
                        <span className={styles.detailValue}>{flat.areaSize} m²</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Year Built:</span>
                        <span className={styles.detailValue}>{flat.yearBuilt}</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Rent:</span>
                        <span className={styles.detailValue}>
                          ${flat.rentPrice?.toLocaleString()}/month
                        </span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>AC:</span>
                        <span className={styles.detailValue}>{flat.hasAC ? "Yes" : "No"}</span>
                      </div>
                      <div className={styles.flatDetail}>
                        <span className={styles.detailLabel}>Available:</span>
                        <span className={styles.detailValue}>{formatDate(flat.dateAvailable)}</span>
                      </div>
                      {flat.createdBy && Array.isArray(flat.createdBy) && flat.createdBy.length > 0 && (
                        <div className={styles.flatDetail}>
                          <span className={styles.detailLabel}>Listed by:</span>
                          <span className={styles.detailValue}>
                            {flat.createdBy[0].firstName} {flat.createdBy[0].lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.listingDate}>
                      Listed on: {formatDate(flat.createdAt)}
                    </div>
                    <div className={styles.actionSection}>
                      <MessageButton flat={flat} />
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

export default AllFlats;