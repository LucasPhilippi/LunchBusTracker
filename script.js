const map = L.map('map').setView([51.505, -0.09], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const busIcon = L.icon({
    iconUrl: 'lunchbus.png',
    iconSize: [135, 90]
})

const marker = L.marker([0, 0], { icon: busIcon }).addTo(map);

const finishIcon = L.icon({
    iconUrl: 'copernicus.webp',
    iconSize: [60, 60]
});

const destination = L.marker([52.29202405462692, 4.726858205798323], { icon: finishIcon }).addTo(map);

map.setView(destination.getLatLng(), 15); 

async function updateMarkerPosition() {
    const response = await fetch("/api/location");
    const {latitude, longitude} = await response.json();
    const newLatLng = new L.LatLng(latitude, longitude);
    marker.setLatLng(newLatLng);

    const bounds = L.latLngBounds([marker.getLatLng(), destination.getLatLng()]);
    map.fitBounds(bounds, { padding: [50, 50] });
}

updateMarkerPosition();

setInterval(updateMarkerPosition, 15000);