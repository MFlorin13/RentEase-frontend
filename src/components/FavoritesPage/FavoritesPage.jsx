import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../Auth/Auth';
import { useFavorites } from '../Context/FavoriteContext/FavoriteContext';
import styles from './FavoritesPage.module.css';

const FavoritesPage = () => {
  const [favoriteFlats, setFavoriteFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const { toggleFavorite, loadFavorites } = useFavorites();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/favorites', { 
          withCredentials: true 
        });
        
        let flatsData = [];
        if (Array.isArray(response.data)) {
          flatsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          flatsData = response.data.data;
        } else if (response.data.favorites && Array.isArray(response.data.favorites)) {
          flatsData = response.data.favorites;
        } else if (response.data.status === 'success' && response.data.data) {
          flatsData = Array.isArray(response.data.data) ? response.data.data : [];
        } else {
          flatsData = [];
        }
      
        setFavoriteFlats(flatsData);
        
      } catch (err) {
        console.error('Error fetching favorites:', err);
        console.error('Error response:', err.response?.data);
        setError('Failed to load favorites');
        setFavoriteFlats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isLoggedIn, navigate]);

  const handleToggleFavorite = async (flatId) => {
    
    try {
      await toggleFavorite(flatId);
      
      setFavoriteFlats(prev => {
        const updated = Array.isArray(prev) ? prev.filter(flat => (flat._id || flat.id) !== flatId) : [];
        return updated;
      });
      
      setTimeout(() => {
        loadFavorites();
      }, 500);
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      loadFavorites();
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

  if (!isLoggedIn) return null;
  if (loading) return <div className={styles.loading}>Loading favorites...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  const flatsToRender = Array.isArray(favoriteFlats) ? favoriteFlats : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Favorite Flats</h1>
        <p className={styles.subtitle}>
          {flatsToRender.length} favorite{flatsToRender.length !== 1 ? 's' : ''}
        </p>
      </div>

      {flatsToRender.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't added any flats to your favorites yet.</p>
          <button onClick={() => navigate('/')} className={styles.browseButton}>
            Browse Available Flats
          </button>
        </div>
      ) : (
        <div className={styles.flatsGrid}>
          {flatsToRender.map((flat) => {
            const flatId = flat._id || flat.id;
            
            if (!flatId) {
              console.warn('Flat missing ID:', flat);
              return null;
            }

            return (
              <div key={flatId} className={styles.flatCard}>
                <div className={styles.imageContainer}>
                  {flat.imageUrl && (
                    <img
                      src={flat.imageUrl}
                      alt={`Flat in ${flat.city || 'Unknown location'}`}
                      className={styles.flatImage}
                    />
                  )}
                  <button
                    onClick={() => handleToggleFavorite(flatId)}
                    className={styles.favoriteButton}
                    title="Remove from favorites"
                  >
                    <FaHeart className={styles.heartIcon} />
                  </button>
                </div>

                <div className={styles.flatContent}>
                  {/* Prominent flat title/name */}
                  <h2 className={styles.flatTitle}>
                    {flat.flatName || `${flat.city || 'Unknown'} Apartment`}
                  </h2>

                  <div className={styles.flatDetails}>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>Location:</span>
                      <span className={styles.detailValue}>
                        {flat.city || 'N/A'}, {flat.streetName || 'N/A'} {flat.streetNumber || ''}
                      </span>
                    </div>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>Area:</span>
                      <span className={styles.detailValue}>{flat.areaSize || 'N/A'} m²</span>
                    </div>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>Year Built:</span>
                      <span className={styles.detailValue}>{flat.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>Rent:</span>
                      <span className={styles.detailValue}>
                        ${flat.rentPrice ? flat.rentPrice.toLocaleString() : 'N/A'}/month
                      </span>
                    </div>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>AC:</span>
                      <span className={styles.detailValue}>{flat.hasAC ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={styles.flatDetail}>
                      <span className={styles.detailLabel}>Available:</span>
                      <span className={styles.detailValue}>{formatDate(flat.dateAvailable)}</span>
                    </div>
                  </div>

                  <div className={styles.listingDate}>
                    Listed on: {formatDate(flat.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;