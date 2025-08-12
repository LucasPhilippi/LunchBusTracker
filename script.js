const sencodsBetweenUpdates = 30;
const intervalInMillis = sencodsBetweenUpdates * 1000;
const map = L.map('map').setView([51.505, -0.09], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const busIcon = L.icon({
    iconUrl: 'lunchbus.png',
    iconSize: [135, 90]
})

const finishIcon = L.icon({
    iconUrl: 'copernicus.webp',
    iconSize: [60, 60]
});

const destinationLatLong = [52.29202405462692, 4.726858205798323];
const destination = L.marker(destinationLatLong, { icon: finishIcon }).addTo(map);
map.setView(destination.getLatLng(), 15);

const busMarkers = new Map();

async function updateMarkersOnMap() {
    const allLunchBusLocation = await getAllLunchBusLocations()

    busClosestToDestination = null;
    boundsForClosestToDestination = null;
    distanceClosestToDestination = Infinity;

    allLunchBusLocation.forEach(busData => {
        const {busNumber, latitude, longitude} = busData;
        const latLong = new L.LatLng(latitude, longitude);

        const distanceFromTarget = haversineDistance(latLong, destination.getLatLng());
        if (distanceFromTarget < distanceClosestToDestination) {
            distanceClosestToDestination = distanceFromTarget;
            busClosestToDestination = busData;
            boundsForClosestToDestination = L.latLngBounds([latLong, destination.getLatLng()]);
        }

        if (busMarkers.has(busNumber)) {
            const existingBusMarker = busMarkers.get(busNumber);
            existingBusMarker.setLatLng(latLong);
        }
        else {
            const newBusMarker = L.marker(latLong, { icon: busIcon }).addTo(map);
            busMarkers.set(busNumber, newBusMarker);
        }
    });

    map.fitBounds(boundsForClosestToDestination, { padding: [50, 50] });
}

// returns a list of all busses collected from the API
async function getAllLunchBusLocations() {
    lunchBusses = [];
    lunchBusNumber = 0;

    amountOf5xxErrors = 0;
    maxAmountOf5xxErrors = 10;

    while (true) {
        const endpoint = "/api/location/" + ++lunchBusNumber;
        
        const response = await fetch(endpoint);
        const responseStatus = response.status;
        const responseBody = await response.json();

        if (responseStatus === 404) break;

        if (response.status === 500) {
            if (amountOf5xxErrors >= ++amountOf5xxErrors) break;

            continue;
        }

        lunchBusses.push(responseBody);
    }

    return lunchBusses;
}

// Calculates the distance between two latitude longitude locations, the smaller the return value, the smaller the distance to target location
function haversineDistance(busCoordinates, destination) {
  const earthRadiusKm = 6371;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(destination.lat - busCoordinates.lat);
  const dLon = toRad(destination.lng - busCoordinates.lng);

  const lat1 = toRad(busCoordinates.lat);
  const lat2 = toRad(destination.lat);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

updateMarkersOnMap();

setInterval(updateMarkersOnMap, intervalInMillis);