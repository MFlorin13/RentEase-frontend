import React from 'react';
import { FaSearch } from 'react-icons/fa';
import styles from './SearchComponent.module.css';

export const Search = ({ value, onChange, placeholder }) => {
  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className={styles.searchInput}
      />
      <FaSearch className={styles.searchIcon} />
    </div>
  );
};