import { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../Auth/Auth';

const FavoriteContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoriteProvider');
  }
  return context;
};

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, user } = useAuth();

  // Load user's favorites when they log in
  useEffect(() => {
    if (isLoggedIn && user) {
      loadFavorites();
    } else {
      setFavorites({});
    }
  }, [isLoggedIn, user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      const response = await api.get("/api/favorites", {
        withCredentials: true,
      });

      // Convert array of favorite flats to object for easier lookup
      const favoritesObj = {};
      if (response.data.status === 'success' && Array.isArray(response.data.data)) {
        response.data.data.forEach(flat => {
          const flatId = flat._id || flat.id;
          if (flatId) {
            favoritesObj[flatId] = true;
          }
        });
      }

      setFavorites(favoritesObj);

    } catch (error) {
      console.error('Error loading favorites:', error);
      console.error('Error details:', error.response?.data);
      setFavorites({});
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (flatId) => {
    if (!isLoggedIn) {
      return;
    }

    const isCurrentlyFavorited = favorites[flatId];

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        
        await api.delete(`/api/favorites/${flatId}`, {
          withCredentials: true,
        });
        
        // Update state after successful removal
        setFavorites(prev => {
          const newFavorites = { ...prev };
          delete newFavorites[flatId];
          return newFavorites;
        });
      } else {
        await api.post(`/api/favorites/${flatId}`, {}, {
          withCredentials: true,
        });
        
        // Update state after successful addition
        setFavorites(prev => {
          const newFavorites = { ...prev, [flatId]: true };
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to update favorites';
      console.error('Favorite toggle error:', errorMessage);
      loadFavorites();
      
    }
  };

  const isFavorited = (flatId) => {
    return !!favorites[flatId];
  };

  const getFavoriteCount = () => {
    return Object.keys(favorites).length;
  };

  const clearFavorites = () => {
    setFavorites({});
  };

  const value = {
    favorites,
    loading,
    toggleFavorite,
    isFavorited,
    getFavoriteCount,
    clearFavorites,
    loadFavorites,
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};