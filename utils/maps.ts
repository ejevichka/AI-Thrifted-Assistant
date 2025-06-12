interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
}

export async function getDirections(from: Location, to: Location): Promise<string> {
  try {
    // Format the locations for the Google Maps API
    const origin = from.latitude && from.longitude
      ? `${from.latitude},${from.longitude}`
      : from.address;
    
    const destination = to.latitude && to.longitude
      ? `${to.latitude},${to.longitude}`
      : to.address;

    // Make API call to Google Maps Directions API
    const response = await fetch(
      `/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch directions');
    }

    const data = await response.json();
    return data.directionsUrl;
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
}

export async function getLocationCoordinates(address: string): Promise<{ latitude: number; longitude: number }> {
  try {
    // Make API call to Google Maps Geocoding API
    const response = await fetch(
      `/api/maps/geocode?address=${encodeURIComponent(address)}`
    );

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();
    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Error getting location coordinates:', error);
    throw error;
  }
}

export function generateMapsUrl(location: Location): string {
  const query = location.latitude && location.longitude
    ? `${location.latitude},${location.longitude}`
    : encodeURIComponent(location.address);
  
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function generateDirectionsUrl(from: Location, to: Location): string {
  const origin = from.latitude && from.longitude
    ? `${from.latitude},${from.longitude}`
    : encodeURIComponent(from.address);
  
  const destination = to.latitude && to.longitude
    ? `${to.latitude},${to.longitude}`
    : encodeURIComponent(to.address);
  
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
} 