import './style.css'
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import geobuf from 'geobuf';
import Pbf from 'pbf';
import booleanIntersects from '@turf/boolean-intersects';
import intersect from '@turf/intersect';
import { featureCollection, multiPolygon, polygon } from '@turf/helpers';
import { coordEach, geomEach } from '@turf/meta';
import * as polyclip from 'polyclip-ts';

// Set up the app container with a header, controls, and map
const app = document.querySelector('#app');
app.innerHTML = `
  <div class="header">Dane County School Attendance Areas</div>
  <div class="intro">
    This site is meant to explore the intersections of the attendance areas of Dane County schools and other political subdivision, so the public and elected officials can understand what schools students in the different districts actually attend, and not just what schools are in which district.
  </div>
  <div class="filter-bar">
    <select id="schoolType">
      <option value="elementary">Elementary</option>
      <option value="middle">Middle</option>
      <option value="high">High</option>
    </select>
    <select id="subdivisionType">
      <option value="none">No Filter</option>
      <option value="alder">City Council District</option>
      <option value="supervisor">County Supervisor District</option>
      <option value="municipality">Municipality</option>
      <option value="schooldistrict">School District</option>
      <option value="assembly">State Assembly District</option>
      <option value="senate">State Senate District</option>
    </select>
    <span id="subdivisionSublist"></span>
  </div>
  <div id="map"></div>
`;

// Add a spinner overlay to the app
const spinner = document.createElement('div');
spinner.id = 'spinner-overlay';
spinner.innerHTML = `<div class="spinner"></div>`;
spinner.style.display = 'none';
document.body.appendChild(spinner);

function showSpinner(show) {
  spinner.style.display = show ? 'flex' : 'none';
}

// Center on Dane County, WI
const daneCountyCenter = [43.07, -89.4];
const map = L.map('map').setView(daneCountyCenter, 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Preload all geobuf files and decode at startup
const allGeobufFiles = {
  // School polygons
  elementary: '/geodata/dane_elementaries_colored.pbf',
  middle: '/geodata/dane_middleschools_colored.pbf',
  high: '/geodata/dane_highschools_colored.pbf',
  // Subdivisions
  alder: '/geodata/dane_county_alder_dists.pbf',
  supervisor: '/geodata/dane_county_supervisors.pbf',
  municipality: '/geodata/dane_county_munis.pbf',
  schooldistrict: '/geodata/dane_county_school_districts.pbf',
  assembly: '/geodata/dane_county_assembly_dists.pbf',
  senate: '/geodata/dane_county_senate_districts.pbf',
  public_schools: '/geodata/dane_county_public_schools.pbf',
};

const decodedGeobufs = {};

async function preloadAllGeobufs() {
  const entries = Object.entries(allGeobufFiles);
  await Promise.all(entries.map(async ([key, url]) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    decodedGeobufs[key] = geobuf.decode(new Pbf(buf));
  }));
}

// Extract all subdivision lists at startup
const allSubdivisions = {};
function extractAllSubdivisions() {
  ['alder','supervisor','municipality','schooldistrict','assembly','senate'].forEach(type => {
    const geojson = decodedGeobufs[type];
    if (!geojson) return;
    const features = geojson.features || [];
    features.sort((a, b) => {
      const la = subdivisionLabelProps[type](a) || '';
      const lb = subdivisionLabelProps[type](b) || '';
      return la.localeCompare(lb);
    });
    allSubdivisions[type] = features;
  });
}

// --- URL Query Param Helpers ---
function updateURLParams({ schoolType, subdivisionType, subdivisionIdx }) {
  const params = new URLSearchParams(window.location.search);
  if (schoolType) params.set('schoolType', schoolType); else params.delete('schoolType');
  if (subdivisionType) params.set('subdivisionType', subdivisionType); else params.delete('subdivisionType');
  if (subdivisionIdx !== undefined && subdivisionIdx !== null && subdivisionIdx !== '') params.set('subdivisionIdx', subdivisionIdx); else params.delete('subdivisionIdx');
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    schoolType: params.get('schoolType') || 'elementary',
    subdivisionType: params.get('subdivisionType') || 'none',
    subdivisionIdx: params.get('subdivisionIdx') || '',
  };
}

// Main app startup
(async function startApp() {
  await preloadAllGeobufs();
  extractAllSubdivisions();
  // Read params from URL
  const { schoolType, subdivisionType, subdivisionIdx } = getURLParams();
  setTimeout(() => {
    document.getElementById('app').style.visibility = 'visible';
    map.invalidateSize(); // Ensure Leaflet map resizes to fit container
    // Set initial school type
    schoolTypeSelect.value = schoolType;
    // Initial load
    loadSchoolPolygons(schoolType);
    // Set initial subdivision filter if present
    if (subdivisionType !== 'none' && allSubdivisions[subdivisionType]) {
      const subdivisionTypeSelect = document.getElementById('subdivisionType');
      subdivisionTypeSelect.value = subdivisionType;
      // Trigger change to populate sublist
      subdivisionTypeSelect.dispatchEvent(new Event('change'));
      if (subdivisionIdx !== '') {
        setTimeout(() => {
          const subdivisionSublist = document.getElementById('subdivisionSublist');
          const select = subdivisionSublist.querySelector('select');
          if (select) {
            select.value = subdivisionIdx;
            select.dispatchEvent(new Event('change'));
          }
        }, 0);
      }
    }
  }, 0);
})();

// Hide app until loaded
app.style.visibility = 'hidden';

let schoolLayer = null;
let schoolPointsLayer = null;

function loadSchoolPolygons(type) {
  if (schoolLayer) {
    map.removeLayer(schoolLayer);
  }
  if (schoolPointsLayer) {
    map.removeLayer(schoolPointsLayer);
  }
  const geojson = decodedGeobufs[type];
  if (!geojson) return;
  schoolLayer = L.geoJSON(geojson, {
    style: feature => ({
      color: '#333',
      weight: 1,
      fillColor: feature.properties.mapcolor || '#cccccc',
      fillOpacity: 0.7
    })
  }).addTo(map);
  // Show all school points for this type
  showSchoolPoints(type);
}

function showSchoolPoints(type) {
  if (schoolPointsLayer) {
    map.removeLayer(schoolPointsLayer);
    schoolPointsLayer = null;
  }
  const pointsGeo = decodedGeobufs['public_schools'];
  if (!pointsGeo) return;
  // Filter by school type (Elementary, Middle, High)
  const typeMap = {
    elementary: ['Elementary School'],
    middle: ['Middle School'],
    high: ['High School']
  };
  const features = pointsGeo.features.filter(f => typeMap[type].includes(f.properties.SCHOOLTYPE));
  schoolPointsLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
      radius: 6,
      fillColor: '#0074D9',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }),
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<b>${feature.properties.SCHOOL}</b><br>${feature.properties.FULL_ADDR || ''}`);
    }
  }).addTo(map);
}

// Add this immediately after app.innerHTML = ...
const schoolTypeSelect = document.getElementById('schoolType');
const subdivisionTypeSelect = document.getElementById('subdivisionType');
const subdivisionSublist = document.getElementById('subdivisionSublist');
let currentSubdivisionFeature = null;
let currentSubdivisionLayer = null;
let subdivisionIdxSelect = null; // Only one select at a time

// --- Event Listeners for Filter Bar ---

function getCurrentSubdivisionIdx() {
  const el = document.getElementById('subdivisionIdx');
  return el ? el.value : '';
}

function getCurrentSubdivisionFeature() {
  const type = subdivisionTypeSelect.value;
  const idx = getCurrentSubdivisionIdx();
  const features = allSubdivisions[type] || [];
  return features[idx] || null;
}

function drawSubdivisionBoundary(feature) {
  if (currentSubdivisionLayer) {
    map.removeLayer(currentSubdivisionLayer);
    currentSubdivisionLayer = null;
  }
  if (!feature) return;
  currentSubdivisionLayer = L.geoJSON(feature, {
    style: {
      color: '#d00',
      weight: 3,
      fill: false,
      dashArray: '6 4',
    }
  }).addTo(map);
  const bounds = L.geoJSON(feature).getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { maxZoom: 14, padding: [20, 20] });
  }
}

schoolTypeSelect.addEventListener('change', e => {
  const subdivisionType = subdivisionTypeSelect.value;
  const subdivisionIdx = getCurrentSubdivisionIdx();
  updateURLParams({
    schoolType: schoolTypeSelect.value,
    subdivisionType,
    subdivisionIdx
  });
  if (subdivisionType === 'none' || !subdivisionIdx) {
    loadSchoolPolygons(schoolTypeSelect.value);
  } else {
    const feature = getCurrentSubdivisionFeature();
    drawSubdivisionBoundary(feature);
    filterSchoolPolygonsBySubdivision(feature);
  }
});

subdivisionTypeSelect.addEventListener('change', e => {
  updateURLParams({
    schoolType: schoolTypeSelect.value,
    subdivisionType: e.target.value,
    subdivisionIdx: ''
  });
  // Remove any existing select
  if (subdivisionIdxSelect) {
    subdivisionSublist.removeChild(subdivisionIdxSelect);
    subdivisionIdxSelect = null;
  }
  currentSubdivisionFeature = null;
  drawSubdivisionBoundary(null);
  if (e.target.value === 'none') {
    loadSchoolPolygons(schoolTypeSelect.value);
    return;
  }
  const features = allSubdivisions[e.target.value] || [];
  // Render as a select dropdown
  const select = document.createElement('select');
  select.setAttribute('id', 'subdivisionIdx');
  select.innerHTML = '<option value="">Select...</option>' +
    features.map((f, i) => `<option value="${i}">${subdivisionLabelProps[e.target.value](f)}</option>`).join('');
  subdivisionSublist.appendChild(select);
  subdivisionIdxSelect = select;
  select.addEventListener('change', evt => {
    updateURLParams({
      schoolType: schoolTypeSelect.value,
      subdivisionType: subdivisionTypeSelect.value,
      subdivisionIdx: evt.target.value
    });
    const feature = getCurrentSubdivisionFeature();
    drawSubdivisionBoundary(feature);
    if (!evt.target.value) {
      loadSchoolPolygons(schoolTypeSelect.value);
      return;
    }
    filterSchoolPolygonsBySubdivision(feature);
  });
});

function filterSchoolPolygonsBySubdivision(subdivisionFeature) {
  showSpinner(true);
  const filterLabel = `${schoolTypeSelect.value} + ${subdivisionTypeSelect.value} + ${subdivisionFeature && subdivisionFeature.properties ? (subdivisionFeature.properties.Label || subdivisionFeature.properties.District || subdivisionFeature.properties.LABEL || '') : ''}`;
  const startTime = performance.now();
  setTimeout(() => {
    const geojson = decodedGeobufs[schoolTypeSelect.value];
    if (!geojson) {
      showSpinner(false);
      return;
    }
    // Use turf.js to intersect polygons and only show the part within the subdivision
    const intersectedFeatures = geojson.features.map(f => {
      if (!f.geometry || !subdivisionFeature.geometry) {
        return null;
      }
      const validTypes = ['Polygon', 'MultiPolygon'];
      if (!validTypes.includes(f.geometry.type) || !validTypes.includes(subdivisionFeature.geometry.type)) {
        return null;
      }
      const schoolFeature = { type: 'Feature', geometry: f.geometry, properties: f.properties };
      const subdivFeature = { type: 'Feature', geometry: subdivisionFeature.geometry, properties: subdivisionFeature.properties };
      let intersection = null;
      try {
        try {
          intersection = intersect(featureCollection([schoolFeature, subdivFeature]));
        } catch (e) { 
          console.log('intersects error, trying higher precision:', e, f, subdivisionFeature);
          polyclip.setPrecision(1e-18);
          intersection = intersect(featureCollection([schoolFeature, subdivFeature]));
          polyclip.setPrecision();
        }
      } catch (e) {
        console.log('Still had an Intersection error:', e, f, subdivisionFeature);
        return null;
      }
      if (intersection) {
        intersection.properties = { ...f.properties };
        return intersection;
      }
      return null;
    }).filter(Boolean);
    if (schoolLayer) {
      map.removeLayer(schoolLayer);
    }
    schoolLayer = L.geoJSON({ type: 'FeatureCollection', features: intersectedFeatures }, {
      style: feature => ({
        color: '#333',
        weight: 1,
        fillColor: feature.properties.mapcolor || '#cccccc',
        fillOpacity: 0.7
      })
    }).addTo(map);
    showSchoolPoints(schoolTypeSelect.value);
    showSpinner(false);
    const endTime = performance.now();
    console.log(`[PERF] Intersection and render for filter: ${filterLabel} took ${(endTime - startTime).toFixed(1)} ms`);
  }, 10);
}

// Helper: get label property for each subdivision type
const subdivisionLabelProps = {
  alder: feature => `${feature.properties.Label} (ID: ${feature.properties.ALDERID})`,
  supervisor: feature => `District ${feature.properties.SUPERID}`,
  municipality: feature => feature.properties.LABEL || feature.properties.MCD_NAME,
  schooldistrict: feature => feature.properties.District,
  assembly: feature => `District ${feature.properties.ASM2024}`,
  senate: feature => `District ${feature.properties.SEN2024}`,
};

// Truncate all coordinates of a feature to 10 decimals
function truncateCoordinatesOfFeature(feature) {
  // Use structuredClone if available, otherwise fallback to JSON deep clone
  const truncatedFeature = (typeof structuredClone === 'function')
    ? structuredClone(feature)
    : JSON.parse(JSON.stringify(feature));
  coordEach(truncatedFeature, coord => {
    coord[0] = Number(coord[0].toFixed(10));
    coord[1] = Number(coord[1].toFixed(10));
  });
  return truncatedFeature;
}


// Custom intersection function using polyclip-ts, modeled after turfjs intersect
function daneintersects(features, options = {}) {
  const geoms = [];
  geomEach(features, (geom) => {
    geoms.push(geom.coordinates);
  });
  if (geoms.length < 2) {
    throw new Error('Must specify at least 2 geometries');
  }
  // polyclip.setPrecision(1e-18); // Temporarily commented out for performance testing
  const intersection2 = polyclip.intersection(geoms[0], ...geoms.slice(1));
  if (intersection2.length === 0) return null;
  if (intersection2.length === 1) return polygon(intersection2[0], options.properties);
  return multiPolygon(intersection2, options.properties);
}
