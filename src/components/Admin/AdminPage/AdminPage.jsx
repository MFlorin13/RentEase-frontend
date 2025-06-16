import { useState, useEffect } from 'react';
import { FaUserShield, FaTrash, FaUser } from 'react-icons/fa';
import { useAuth } from '../../Auth/Auth';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPage.module.css';
import UserViewButton from './UserViewButton/UserViewButton';
import api from '../../../api/axiosConfig';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [userFlats, setUserFlats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userType: 'all',
    ageMin: '',
    ageMax: '',
    flatsMin: '',
    flatsMax: '',
    isAdmin: 'all'
  });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin - use user.isAdmin instead of separate isAdmin state
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/'); // Redirect non-admin users
      return;
    }
  }, [isLoggedIn, isAdmin, navigate]);

  // Fixed section of AdminPage.jsx - replace the flats counting logic

  useEffect(() => {
    const fetchUsersAndFlats = async () => {
      try {
        setLoading(true);
        setError('');

        let usersData = [];
        let flatsData = [];

        // Fetch users using the correct endpoint
        try {
          const usersRes = await api.get('/users/all-users', {
            withCredentials: true
          });


          if (usersRes.data.status === 'success' && usersRes.data.data) {
            usersData = usersRes.data.data;
          } else if (Array.isArray(usersRes.data)) {
            usersData = usersRes.data;
          } else {
            throw new Error('Invalid users response format');
          }
        } catch (usersError) {
          throw new Error(usersError.response?.data?.message || 'Failed to fetch users');
        }

        // Fetch flats
        try {
          const flatsRes = await api.get('/flats', {
            withCredentials: true
          });


          if (flatsRes.data.Flats && Array.isArray(flatsRes.data.Flats)) {
            flatsData = flatsRes.data.Flats;
          } else if (Array.isArray(flatsRes.data)) {
            flatsData = flatsRes.data;
          } else if (flatsRes.data.data && Array.isArray(flatsRes.data.data)) {
            flatsData = flatsRes.data.data;
          } else {
            flatsData = [];
          }
        } catch {
          flatsData = []; // Continue without flats data
        }

        const flatsByUser = {};
        flatsData.forEach((flat, index) => {

          let userId = flat.ownerId;

          if (!userId) {
            userId = flat.owner?._id ||
              flat.owner?.id ||
              flat.createdBy?._id ||
              flat.createdBy?.id ||
              flat.userId ||
              flat.createdBy;
          }

          if (!userId && flat.owner && Array.isArray(flat.owner) && flat.owner.length > 0) {
            userId = flat.owner[0]._id || flat.owner[0].id;
          }

          if (userId) {
            const userIdStr = userId.toString();
            flatsByUser[userIdStr] = (flatsByUser[userIdStr] || 0) + 1;
          } else {
            console.warn(`No valid userId found for flat ${index + 1}:`, flat);
          }
        });


        setUserFlats(flatsByUser);
        setUsers(usersData);

      } catch (error) {
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && isAdmin) {
      fetchUsersAndFlats();
    }
  }, [isLoggedIn, isAdmin]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';

    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    } catch {
      return 'N/A';
    }
  };

  const filterAndSortUsers = (users) => {
    let filtered = users.filter(user => {
      const age = calculateAge(user.birthDate);
      const flatsCount = userFlats[user._id?.toString()] || 0;

      if (filters.userType !== 'all') {
        if (filters.userType === 'admin' && !user.isAdmin) return false;
        if (filters.userType === 'regular' && user.isAdmin) return false;
      }
      if (filters.ageMin && age !== 'N/A' && age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && age !== 'N/A' && age > parseInt(filters.ageMax)) return false;
      if (filters.flatsMin && flatsCount < parseInt(filters.flatsMin)) return false;
      if (filters.flatsMax && flatsCount > parseInt(filters.flatsMax)) return false;
      if (filters.isAdmin !== 'all' && user.isAdmin !== (filters.isAdmin === 'true')) return false;

      return true;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.key === 'flatsCount') {
          aVal = userFlats[a._id?.toString()] || 0;
          bVal = userFlats[b._id?.toString()] || 0;
        } else if (sortConfig.key === 'age') {
          aVal = calculateAge(a.birthDate);
          bVal = calculateAge(b.birthDate);
        } else {
          aVal = a[sortConfig.key] || '';
          bVal = b[sortConfig.key] || '';
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        return sortConfig.direction === 'asc'
          ? aVal > bVal ? 1 : -1
          : aVal < bVal ? 1 : -1;
      });
    }

    return filtered;
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleAdminStatus = async (userId) => {
    const targetUser = users.find(u => u._id === userId);

    if (!targetUser) {
      setError('User not found');
      return;
    }

    // Prevent admin from demoting themselves
    if (targetUser._id === user._id) {
      setError('You cannot change your own admin status');
      return;
    }

    try {

      // Use the correct endpoint from your routes
      await api.patch(
        `/users/editUser/${userId}`,
        { isAdmin: !targetUser.isAdmin },
        { withCredentials: true }
      );

      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u
      ));
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle admin status');
    }
  };

  const deleteUser = async (userId) => {
    const targetUser = users.find(u => u._id === userId);

    if (!targetUser) {
      setError('User not found');
      return;
    }

    // Prevent admin from deleting themselves
    if (targetUser._id === user._id) {
      setError('You cannot delete your own account');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {

      // Use the correct endpoint from your routes
      await api.delete(
        `/users/deleteProfile/${userId}`,
        { withCredentials: true }
      );

      setUsers(prev => prev.filter(u => u._id !== userId));

      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Show loading or redirect if not admin
  if (!isLoggedIn) {
    return <div className={styles.loading}>Redirecting to login...</div>;
  }

  if (!isAdmin) {
    return <div className={styles.error}>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div className={styles.loading}>Loading users...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => {
          setError('');
          window.location.reload();
        }}>
          Retry
        </button>
      </div>
    );
  }


  const filteredUsers = filterAndSortUsers(users);

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>
          Total Users: {users.length} | Filtered: {filteredUsers.length}
        </p>
      </div>

      <div className={styles.filtersSection}>
        <h2 className={styles.sectionTitle}>Filter Options</h2>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>User Type</label>
            <select
              name="userType"
              value={filters.userType}
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="regular">Regular Users</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Age Range</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                name="ageMin"
                placeholder="Min"
                value={filters.ageMin}
                onChange={handleFilterChange}
                className={styles.filterInput}
                min="0"
                max="120"
              />
              <input
                type="number"
                name="ageMax"
                placeholder="Max"
                value={filters.ageMax}
                onChange={handleFilterChange}
                className={styles.filterInput}
                min="0"
                max="120"
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Flats Count Range</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                name="flatsMin"
                placeholder="Min"
                value={filters.flatsMin}
                onChange={handleFilterChange}
                className={styles.filterInput}
                min="0"
              />
              <input
                type="number"
                name="flatsMax"
                placeholder="Max"
                value={filters.flatsMax}
                onChange={handleFilterChange}
                className={styles.filterInput}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className={styles.sortSection}>
          <h2 className={styles.sectionTitle}>Sort By</h2>
          <div className={styles.sortButtons}>
            <button
              onClick={() => handleSort('firstName')}
              className={`${styles.sortButton} ${sortConfig.key === 'firstName' ? styles.activeSortButton : ''}`}
            >
              First Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('lastName')}
              className={`${styles.sortButton} ${sortConfig.key === 'lastName' ? styles.activeSortButton : ''}`}
            >
              Last Name {sortConfig.key === 'lastName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('age')}
              className={`${styles.sortButton} ${sortConfig.key === 'age' ? styles.activeSortButton : ''}`}
            >
              Age {sortConfig.key === 'age' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('flatsCount')}
              className={`${styles.sortButton} ${sortConfig.key === 'flatsCount' ? styles.activeSortButton : ''}`}
            >
              Flats Count {sortConfig.key === 'flatsCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError('')}
            className={styles.dismissError}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.usersGrid}>
        {filteredUsers.length === 0 ? (
          <div className={styles.noResults}>
            <h3>No users match the current filters</h3>
            <p>Try adjusting your filter criteria</p>
          </div>
        ) : (
          filteredUsers.map(userItem => (
            <div key={userItem._id} className={styles.userCard}>
              <div className={styles.userHeader}>
                <h2 className={styles.userName}>
                  {userItem.firstName || 'N/A'} {userItem.lastName || 'N/A'}
                </h2>
                <div className={styles.userEmail}>{userItem.email || 'N/A'}</div>
              </div>

              <div className={styles.userContent}>
                <div className={styles.userDetail}>
                  <span className={styles.detailLabel}>Age:</span>
                  <span className={styles.detailValue}>
                    {calculateAge(userItem.birthDate)} {calculateAge(userItem.birthDate) !== 'N/A' ? 'years' : ''}
                  </span>
                </div>

                <div className={styles.userDetail}>
                  <span className={styles.detailLabel}>Flats Count:</span>
                  <span className={styles.detailValue}>
                    {userFlats[userItem._id?.toString()] || 0}
                  </span>
                </div>

                <div className={styles.userDetail}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span>
                    {userItem.isAdmin ? (
                      <span className={styles.adminBadge}>
                        <FaUserShield /> Admin
                      </span>
                    ) : (
                      <span className={styles.userBadge}>
                        <FaUser /> User
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.adminActions}>
                <button
                  onClick={() => toggleAdminStatus(userItem._id)}
                  className={`${styles.actionButton} ${styles.adminButton}`}
                  title={userItem.isAdmin ? "Remove admin status" : "Grant admin status"}
                  disabled={userItem._id === user._id} // Disable for current user
                >
                  <FaUserShield />
                  {userItem.isAdmin ? "Remove Admin" : "Make Admin"}
                </button>
                <button
                  onClick={() => deleteUser(userItem._id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Delete user"
                  disabled={userItem._id === user._id} // Disable for current user
                >
                  <FaTrash />
                  Delete
                </button>
              </div>

              <div className={styles.viewProfileContainer}>
                <UserViewButton
                  user={userItem}
                  userFlats={userFlats}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPage;