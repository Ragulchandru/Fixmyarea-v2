import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix Vite leaflet icon bundling bug
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Category Color Helper for status marker icons
const getStatusColor = (status) => {
  switch (status) {
    case 'resolved': return '#22C55E';
    case 'in_progress': return '#F59E0B';
    case 'assigned': return '#2563EB';
    case 'verified': return '#6366F1';
    default: return '#EF4444';
  }
};

const TNMap = ({ 
  issues = [], 
  interactive = false, 
  onLocationSelect = null, 
  initialLocation = { lat: 11.127122, lng: 78.656894 }, // Center of Tamil Nadu
  zoom = 7,
  height = '400px',
  isDarkMode = false
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const navigate = useNavigate();

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [initialLocation.lat, initialLocation.lng],
      zoom: zoom,
      zoomControl: true
    });

    mapInstanceRef.current = map;

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create Markers Group
    markersGroupRef.current = L.layerGroup().addTo(map);

    // 2. Setup interactive picker marker if requested
    if (interactive && onLocationSelect) {
      // Create initial draggable marker
      const marker = L.marker([initialLocation.lat, initialLocation.lng], {
        draggable: true
      }).addTo(map);

      selectedMarkerRef.current = marker;

      // Map click handler to move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onLocationSelect({ lat, lng });
      });

      // Marker drag event
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        onLocationSelect({ lat, lng });
      });
    }

    // Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Watch Dark Mode Changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (isDarkMode) {
      mapContainerRef.current.classList.add('dark-mode-map');
    } else {
      mapContainerRef.current.classList.remove('dark-mode-map');
    }
  }, [isDarkMode]);

  // 3. Watch Issues and Update Markers
  useEffect(() => {
    if (interactive || !mapInstanceRef.current || !markersGroupRef.current) return;

    // Clear existing markers
    markersGroupRef.current.clearLayers();

    // Plot pins for verified reports
    issues.forEach(issue => {
      if (!issue.location || !issue.location.lat || !issue.location.lng) return;

      const { lat, lng } = issue.location;
      const color = getStatusColor(issue.status);

      // Create a custom SVG marker based on status
      const svgIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lng], { icon: svgIcon });

      // Build popup content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-slate-800 dark:text-slate-200 text-xs w-48 font-sans';
      
      const imgHtml = issue.imageUrl 
        ? `<img src="${issue.imageUrl}" class="w-full h-20 object-cover rounded-md mb-2" alt="${issue.title}" />` 
        : '';
        
      const statusLabels = {
        verified: 'Verified',
        assigned: 'Assigned',
        in_progress: 'In Progress',
        resolved: 'Resolved'
      };

      popupDiv.innerHTML = `
        ${imgHtml}
        <h4 class="font-bold text-slate-900 dark:text-white truncate mb-1">${issue.title}</h4>
        <div class="flex items-center space-x-1.5 mb-1.5">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white uppercase" style="background-color: ${color}">
            ${statusLabels[issue.status] || issue.status}
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 capitalize">${issue.category}</span>
        </div>
        <p class="text-slate-500 dark:text-slate-400 text-[10px] mb-2 truncate">${issue.location.address || 'Tamil Nadu'}</p>
        <button id="btn-${issue._id}" class="w-full bg-primary hover:bg-primary/90 text-white font-medium py-1 px-2 rounded text-[10px] transition-colors cursor-pointer text-center block">
          View Report details
        </button>
      `;

      marker.bindPopup(popupDiv);

      // Programmatically handle button clicks inside leaflet popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${issue._id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/issue-detail/${issue._id}`);
          };
        }
      });

      markersGroupRef.current.addLayer(marker);
    });

    // Auto-fit bounds if we have markers (and not single center initial view)
    if (issues.length > 0 && !interactive) {
      const bounds = L.latLngBounds(issues.map(i => [i.location.lat, i.location.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [issues, interactive]);

  // 4. Update picker marker if initialLocation changes (for address lookup map moves)
  useEffect(() => {
    if (interactive && mapInstanceRef.current && selectedMarkerRef.current) {
      const { lat, lng } = initialLocation;
      selectedMarkerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], zoom);
    }
  }, [initialLocation]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50">
      <div 
        ref={mapContainerRef} 
        style={{ height: height, width: '100%' }}
        className="z-10 bg-slate-100 dark:bg-slate-900"
      />
    </div>
  );
};

export default TNMap;
