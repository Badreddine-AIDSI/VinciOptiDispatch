// Make sure this is correctly handling all possible coordinate formats

export const parseCoordinate = (value) => {
  if (value === null || value === undefined) return 0;
  
  // Handle string values like "-7.65" as well as numbers
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
};