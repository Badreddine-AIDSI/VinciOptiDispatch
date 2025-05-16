import axios from 'axios';

/**
 * Get directions between two points using OpenStreetMap Routing API
 * 
 * @param {Object} origin - { latitude, longitude }
 * @param {Object} destination - { latitude, longitude }
 * @returns {Promise} - resolves to an array of coordinates for the route
 */
export const getDirections = async (origin, destination) => {
  try {
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson`
    );

    if (response.data.code !== 'Ok') {
      throw new Error('Directions request failed: ' + response.data.message);
    }

    // Extract coordinates from the GeoJSON response
    const coordinates = response.data.routes[0].geometry.coordinates;
    
    // Convert from [lng, lat] to {latitude, longitude} format
    return coordinates.map(coord => ({
      longitude: coord[0],
      latitude: coord[1]
    }));
  } catch (error) {
    console.error('Error fetching directions:', error);
    return [];
  }
};