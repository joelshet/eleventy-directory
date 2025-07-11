// src/js/map.js
if (typeof locations !== 'undefined' && locations.length > 0) {
  const map = L.map('map').setView([locations[0].latitude, locations[0].longitude], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Create a layer group to hold markers
  const markerGroup = L.layerGroup().addTo(map);

  // Create custom red marker icon
  const redIcon = L.divIcon({
    className: 'custom-red-marker',
    html: `<div style="
      width: 35px;
      height: 35px;
      background-color: rgb(254 74 96);
      border: 2px solid white;
      border-radius: 50% 50% 50% 0%;
      transform: rotate(-45deg);
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "><div style="
      width: 12px;
      height: 12px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 12px;
      left: 12px;
    "></div></div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });

  function renderMarkers(items) {
    markerGroup.clearLayers(); // Clear old markers
    items.forEach(item => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude], { icon: redIcon });
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
    const cards = document.querySelectorAll('.card');
    
    let newItems;
    if (cards.length === 0) {
      // No cards found (e.g., search reset or no results) - fall back to original locations
      newItems = locations;
    } else {
      // Parse items from DOM
      newItems = Array.from(cards).map(card => ({
        id: card.id.replace('item-',''),
        latitude: card.dataset.lat,
        longitude: card.dataset.lon,
        name: card.querySelector('h2, h3').innerText
      }));
    }
    
    renderMarkers(newItems);
  });

  // Add click listeners to cards
  document.getElementById('directory-results').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
          const itemId = card.id.replace('item-','');
          highlightCard(itemId);
          map.flyTo([card.dataset.lat, card.dataset.lon], 14);
      }
  });
} 