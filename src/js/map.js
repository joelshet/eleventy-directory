// src/js/map.js
if (typeof locations !== 'undefined' && locations.length > 0) {
  const map = L.map('map').setView([locations[0].latitude, locations[0].longitude], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Create a layer group to hold markers
  const markerGroup = L.layerGroup().addTo(map);

  function renderMarkers(items) {
    markerGroup.clearLayers(); // Clear old markers
    items.forEach(item => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude]);
        marker.bindPopup(`<b>${item.name}</b>`);
        marker.on('click', () => highlightCard(item.id));
        marker.addTo(markerGroup);
      }
    });
  }

  function highlightCard(itemId) {
    document.querySelectorAll('.card.highlight').forEach(c => c.classList.remove('highlight'));
    const cardElement = document.getElementById(`item-${itemId}`);
    if (cardElement) {
      cardElement.classList.add('highlight');
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Initial render
  renderMarkers(locations);

  // Listen for HTMX finishing a request to update the map
  document.body.addEventListener('htmx:afterSwap', function(evt) {
    // We need to get the new items from the DOM, as 'locations' is stale
    const newItems = Array.from(document.querySelectorAll('.card')).map(card => ({
        id: card.id.replace('item-',''),
        latitude: card.dataset.lat,
        longitude: card.dataset.lon,
        name: card.querySelector('h2').innerText // A bit hacky, but works for the demo
    }));
    renderMarkers(newItems);
  });

  // Add click listeners to cards
  document.getElementById('directory-results').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
          map.flyTo([card.dataset.lat, card.dataset.lon], 14);
      }
  });
} 