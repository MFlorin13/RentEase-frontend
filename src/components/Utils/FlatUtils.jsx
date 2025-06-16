export const applyFilters = (flats, filters, searchQuery) => {
    let result = [...flats];
  
    if (searchQuery) {
  const query = searchQuery.toLowerCase();
  
  // Check if search query is a number (for area size search)
  const isNumericSearch = !isNaN(query) && query !== '';
  const numericQuery = parseFloat(query);
  
  result = result.filter(flat => {
    // Your existing city and street search
    const textMatch = (
      flat.city.toLowerCase().includes(query) ||
      flat.streetName.toLowerCase().includes(query)
    );
    
    // New area size search
    let areaMatch = false;
    if (isNumericSearch && flat.areaSize) {
      // Match if area size is within ±10m² of the searched number
      areaMatch = (
        flat.areaSize >= numericQuery - 10 && 
        flat.areaSize <= numericQuery + 10
      );
    }
    
    // Return true if either text search or area search matches
    return textMatch || areaMatch;
  });
}
  
    if (filters.city) {
      result = result.filter(flat => 
        flat.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
  
    if (filters.minPrice) {
      result = result.filter(flat => 
        flat.rentPrice >= Number(filters.minPrice)
      );
    }
  
    if (filters.maxPrice) {
      result = result.filter(flat => 
        flat.rentPrice <= Number(filters.maxPrice)
      );
    }
  
    if (filters.minArea) {
      result = result.filter(flat => 
        flat.areaSize >= Number(filters.minArea)
      );
    }
  
    if (filters.maxArea) {
      result = result.filter(flat => 
        flat.areaSize <= Number(filters.maxArea)
      );
    }
  
    return result;
  };
  
  export const sortFlats = (flats, key, direction) => {
    return [...flats].sort((a, b) => {
      if (key === 'city') {
        return direction === 'asc' 
          ? a.city.localeCompare(b.city)
          : b.city.localeCompare(a.city);
      }
      return direction === 'asc' 
        ? a[key] - b[key]
        : b[key] - a[key];
    });
  };