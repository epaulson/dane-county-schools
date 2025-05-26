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
  <div class="top-bar">
    <div class="top-bar-left">
      <select id="schoolType">
        <option value="elementary">Elementary Schools</option>
        <option value="middle">Middle Schools</option>
        <option value="high">High Schools</option>
      </select>
    </div>
    <div class="top-bar-right">
      <button id="aboutBtn" type="button">About</button>
    </div>
  </div>
  <div class="filter-bar">
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
  <div id="aboutModal" class="modal" style="display:none;">
    <div class="modal-content">
      <span class="close" id="aboutModalClose">&times;</span>
      <div class="about-text">
      <h3>About This App</h3>
        <p>This app was created by <a href="https://posts.unit1127.com" target="_blank" rel="noopener">Erik Paulson</a> and the source code is available on <a href="https://github.com/epaulson/dane-county-schools" target="_blank" rel="noopener">Github</a></p>
        <p>This site is meant to explore the intersections of the attendance areas of Dane County schools and other political subdivision, so the public and elected officials can understand what schools students in the different districts actually attend, and not just what schools are in which district.</p>
        <p>This site lets you explore Dane County school attendance areas. It is filterable by different political subdivisions. When I was on the Madison Common Council, this was the app I wanted so I could say "where do students in my district attend school", which is a different question that "what schools are in my district?"</p> 
        <p>There is no comprehensive school attendance area map for all schools, so I compiled one from multiple data sources in May of 2025. To be clear, this map is unofficial and should not be used for enrolling students. Even if it were official, school districts to not always follow enrollment area maps in order to balance class sizes between schools and for other reasons. Always consult with your district before enrolling a student.</p>
        <p>To make this data easier to use, I created this web application that lets you not only see the attendance areas, but you can filter the attendance areas by other political subdivisions. The app will create the intersection of the school attendance areas and that political subdivision.</p>
        <p>The colored polygons on the map represent school attendance areas. You can choose between elementary, middle, and high schools. If you click on a polygon, you'll see a popup with the name of that school, any school-specific notes, and links to the school website, the WI Department of Public Instruction Directory Page for that school, and the page for that school at the federal National Center for Educational Statistics.</p> 
        <p>The app lets you filter attendance areas by city council/aldermanic districts, county supervisor districts, municipalities, school districts, state assembly districts, and state senate districts. For state positions, because I only collected school information for districts that intersect Dane County, not all assembly and senate districts have all schools attendance areas, and I only set up state legislative districts for districts that are at least in part in Dane County. </p>
        <p>The app also displays the locations of schools, including some schools that do not have attendance areas like charter schools.</p>
        <p>The URL contains all of the filter state, so you can share the URL with someone and they will see exactly what you are seeing.</p>
        <p>The colors are mostly random but filled with a graph coloring algorithm to avoid having two neighboring attendance areas having the exact same color. I did make some effort to have some high schools use their school color but I did not do this for every high school, and did not do anything for the elementary or middle schools.</p>
        <p>For Madison alders, I have already created PDF versions of the maps for their district, available at <a href="https://epaulson.github.io/madison-schools-by-alder/" target="_blank" rel="noopener">epaulson.github.io/madison-schools-by-alder</a>.</p>
      <h3>Data Sources and Thanks</h3>
        <p>The datafiles for this app can be found in the <a href="https://github.com/epaulson/dane-county-schools" target="_blank" rel="noopener">Github repository for the app</a>. The README file in the repo explains the data sources.</p>
        <p>Special thanks to the following folks who provided the data or answered questions:
        <ul> 
          <li>Shelley Witte of the Wisconsin Department of Public Instruction who manages the excellent <a href="https://dpi.wi.gov/wise/gis-maps/gis-open-data" target="_blank" rel="noopener">DPI Open Data Portal</a>, which is where much of the data comes from. She also created the School Directory site at DPI, which this app links to for each school. Shelley also answered many questions as I was starting out on this app.</li> 
          <li><a href="https://grubeg.github.io/"target="_blank" rel="noopener">Greg Grube</a> of the Wisconsin Elections Commission, who created the datafile for the alder districts for the non-Madison alder districts.</li> 
          <li>The team behind the Legislative Technology Services Bureau of the Wisconsin Legislature and the Madison Open Data Portal, who provided much of the rest of the political subdivision data.</li>
          <li>Eric Lequesne of MMSD's Research Assessment, and Improvement team for Madison School data</li>
          <li>Louis Rada of the City of Sun Prairie for Sun Prairie School District data</li>
          <li>Michael LaCount of the Verona Area School District for Verona School District data</li>
          <li>Dr. Dennis Pauli, superintendent of the Edgerton School District, and Kathy Pierce, Registrar of Edgerton Schools, for help and data for Edgerton</li>
          <li>Dr. Leslie Bergstrom, superintendent of the Oregon School District, for answering questions on the Oregon attendance areas</li>
        </ul>
        <br/<br/><br/><br/
    </div>
  </div>
`;

// Modal logic
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutModalClose = document.getElementById('aboutModalClose');
aboutBtn.onclick = () => { 
  aboutModal.style.display = 'block';
  aboutModal.classList.add('show');
  document.body.classList.add('modal-open');
};
aboutModalClose.onclick = () => { 
  aboutModal.style.display = 'none';
  aboutModal.classList.remove('show');
  document.body.classList.remove('modal-open');
};
window.onclick = function(event) {
  if (event.target === aboutModal) {
    aboutModal.style.display = 'none';
    aboutModal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

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
  elementary: 'geodata/dane_elementaries_colored.pbf',
  middle: 'geodata/dane_middleschools_colored.pbf',
  high: 'geodata/dane_highschools_colored.pbf',
  // Subdivisions
  alder: 'geodata/dane_county_alder_dists.pbf',
  supervisor: 'geodata/dane_county_supervisors.pbf',
  municipality: 'geodata/dane_county_munis.pbf',
  schooldistrict: 'geodata/dane_county_school_districts.pbf',
  assembly: 'geodata/dane_county_assembly_dists.pbf',
  senate: 'geodata/dane_county_senate_districts.pbf',
  public_schools: 'geodata/dane_county_public_schools.pbf',
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
  showSpinner(true);
  await preloadAllGeobufs();
  extractAllSubdivisions();
  // Read params from URL
  const { schoolType, subdivisionType, subdivisionIdx } = getURLParams();
  setTimeout(() => {
    showSpinner(false);
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

// Add a variable to control initial state of school icons
let showSchoolIcons = true;

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
    }),
    onEachFeature: (feature, layer) => {
      layer.on('click', function(e) {
        const props = feature.properties || {};
        // School name
        const name = props.schoolname || props.SCHOOL || props.School || props.Label || props.LABEL || props.NAME || props.District || props.DISTRICT || props.MCD_NAME || props.DISTNAME || props.ASM2024 || props.SEN2024 || props.SUPERID || 'Attendance Area';
        // Grades served
        const grades = props.grades_svd || props.GRADE_RANG || '';
        // School website
        const website = props.website || props.SCHOOL_URL || '';
        // DPI and NCES IDs
        const dpi_dis_id = props.dpi_dis_id || props.SDID || '';
        const dpi_sch_id = props.dpi_sch_id || props.SCH_CODE || '';
        const nces_id = props.nces_id || props.NCES_CODE || '';
        // Notes
        const notes = props.notes || '';
        // Links (only if IDs exist)
        let links = '';
        if (website) {
          links += `<a href="${website}" target="_blank" rel="noopener">School Website</a><br>`;
        }
        if (dpi_dis_id && dpi_sch_id) {
          links += `<a href="https://apps6.dpi.wi.gov/SchDirPublic/school-profile?district=${dpi_dis_id}&school=${dpi_sch_id}" target="_blank" rel="noopener">WI DPI School Page</a><br>`;
        }
        if (nces_id) {
          links += `<a href="https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=${nces_id}" target="_blank" rel="noopener">NCES School Page</a><br>`;
        }
        let content = `<b>${name}</b>`;
        if (grades) content += `<br>Grades: ${grades}`;
        if (notes) content += `<br><i>${notes}</i>`;
        if (links) content += `<br>${links}`;
        layer._map && L.popup().setLatLng(e.latlng).setContent(content).openOn(layer._map);
      });
    }
  }).addTo(map);
  // Show all school points for this type, but no popups on marker click
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

  // Helper to create a marker icon (SVG only or SVG+label)
  function createSchoolIconWithLabel(schoolName, showLabel) {
    const iconUrl = `${import.meta.env.BASE_URL}school_icon_transparent.svg`;
    if (!showLabel) {
      return L.icon({
        iconUrl,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
        className: 'school-marker-icon'
      });
    } else {
      // Use a DivIcon to combine SVG and label, with transparent background
      return L.divIcon({
        className: 'school-marker-label',
        html: `<div style="display:flex;align-items:center;gap:4px;"><img src='${iconUrl}' width='24' height='24' style='display:inline-block;vertical-align:middle;'/><span style='color:#222;font-size:13px;font-weight:500;text-shadow:0 1px 2px #fff,0 0 2px #fff;background:transparent;padding:1px 4px;border-radius:3px;'>${schoolName.replace(/"/g,'&quot;')}</span></div>`,
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    }
  }

  // Helper to (re)draw the school points with/without labels
  function drawSchoolPointsWithLabels() {
    if (schoolPointsLayer) {
      map.removeLayer(schoolPointsLayer);
      schoolPointsLayer = null;
    }
    if (!showSchoolIcons) {
      // Don't show icons if toggled off
      return;
    }
    const showLabel = map.getZoom() >= 14;
    schoolPointsLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
      pointToLayer: (feature, latlng) => {
        const name = feature.properties.SCHOOLNAME || feature.properties.SCHOOL || feature.properties.Label || feature.properties.NAME || '';
        return L.marker(latlng, {
          icon: createSchoolIconWithLabel(name, showLabel),
          interactive: false // allow clicks to pass through to polygons
        });
      },
      onEachFeature: () => {}
    }).addTo(map);
  }

  drawSchoolPointsWithLabels();

  // Listen for zoom events to update labels dynamically
  if (map._schoolLabelZoomHandler) {
    map.off('zoomend', map._schoolLabelZoomHandler);
  }
  map._schoolLabelZoomHandler = function() {
    drawSchoolPointsWithLabels();
  };
  map.on('zoomend', map._schoolLabelZoomHandler);

  // Expose for external control
  showSchoolPoints._redraw = drawSchoolPointsWithLabels;
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

function closeAllPopups() {
  if (map && map.closePopup) map.closePopup();
}

schoolTypeSelect.addEventListener('change', e => {
  closeAllPopups();
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
  closeAllPopups();
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
    closeAllPopups();
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
      }),
      onEachFeature: (feature, layer) => {
        layer.on('click', function(e) {
          const props = feature.properties || {};
          // School name
          const name = props.schoolname || props.SCHOOL || props.School || props.Label || props.LABEL || props.NAME || props.District || props.DISTRICT || props.MCD_NAME || props.DISTNAME || props.ASM2024 || props.SEN2024 || props.SUPERID || 'Attendance Area';
          // Grades served
          const grades = props.grades_svd || props.GRADE_RANG || '';
          // School website
          const website = props.website || props.SCHOOL_URL || '';
          // DPI and NCES IDs
          const dpi_dis_id = props.dpi_dis_id || props.SDID || '';
          const dpi_sch_id = props.dpi_sch_id || props.SCH_CODE || '';
          const nces_id = props.nces_id || props.NCES_CODE || '';
          // Notes
          const notes = props.notes || '';
          // Links (only if IDs exist)
          let links = '';
          if (website) {
            links += `<a href="${website}" target="_blank" rel="noopener">School Website</a><br>`;
          }
          if (dpi_dis_id && dpi_sch_id) {
            links += `<a href="https://apps6.dpi.wi.gov/SchDirPublic/school-profile?district=${dpi_dis_id}&school=${dpi_sch_id}" target="_blank" rel="noopener">WI DPI School Page</a><br>`;
          }
          if (nces_id) {
            links += `<a href="https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=${nces_id}" target="_blank" rel="noopener">NCES School Page</a><br>`;
          }
          let content = `<b>${name}</b>`;
          if (grades) content += `<br>Grades: ${grades}`;
          if (notes) content += `<br><i>${notes}</i>`;
          if (links) content += `<br>${links}`;
          layer._map && L.popup().setLatLng(e.latlng).setContent(content).openOn(layer._map);
        });
      }
    }).addTo(map);
    showSchoolPoints(schoolTypeSelect.value);
    showSpinner(false);
    const endTime = performance.now();
    console.log(`[PERF] Intersection and render for filter: ${filterLabel} took ${(endTime - startTime).toFixed(1)} ms`);
  }, 10);
}

// Helper: get label property for each subdivision type
const subdivisionLabelProps = {
  alder: feature => `${feature.properties.MuniName} D-${feature.properties.ALDERID}`,
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

// Add a Leaflet control for toggling school icons (UI only, no logic)
const SchoolIconsControl = L.Control.extend({
  options: { position: 'topright', showSchoolIcons: true },
  initialize: function(options) {
    L.Util.setOptions(this, options);
  },
  onAdd: function(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    container.style.background = 'rgba(255,255,255,0.85)';
    container.style.padding = '0.3em 0.8em 0.3em 0.5em';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '0.4em';
    container.style.fontSize = '1em';
    container.style.fontWeight = '500';
    container.style.userSelect = 'none';
    container.style.zIndex = 1200;
    
    const checkbox = L.DomUtil.create('input', '', container);
    checkbox.type = 'checkbox';
    checkbox.id = 'toggleSchoolIcons';
    checkbox.checked = this.options.showSchoolIcons;
    checkbox.style.marginRight = '0.4em';
    // Use default browser checkbox appearance
    
    const label = L.DomUtil.create('label', '', container);
    label.htmlFor = 'toggleSchoolIcons';
    label.textContent = 'Display School Icons';
    label.style.color = '#222';
    
    // Prevent map drag when interacting with control
    L.DomEvent.disableClickPropagation(container);

    // Add event listener to update showSchoolIcons and redraw
    checkbox.addEventListener('change', function() {
      showSchoolIcons = checkbox.checked;
      if (typeof showSchoolPoints._redraw === 'function') {
        showSchoolPoints._redraw();
      }
    });
    return container;
  }
});
map.addControl(new SchoolIconsControl({ showSchoolIcons }));
