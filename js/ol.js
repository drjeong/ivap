/**
 * Control map representation with openlayers
 * @author Dong Hyun Jeong <djeong@udc.edu>
 *     references: https://stackoverflow.com/questions/55789146/how-to-add-a-marker-to-openlayers-map
 *     6/19/2023 - initial version
 */

// US Center location
const USCenterLon = '-98.35';
const USCenterLat = '39.50';
const UDClongitude = '-77.0637';  // UDC location
const UDClatitude = '38.9445';	// UDC location

/**
 * Initalize Map
 * @param id
 * @param zoomlevel
 * @param Lon
 * @param Lat
 * @param MarkerName
 * @returns {*}
 */
function olInitMap(id='map', zoomlevel = 12, Lon=UDClongitude, Lat=UDClatitude, MarkerName='Marker')
{
	// Add CSS fix for the overflow warning
	const styleFixForOverflow = document.createElement('style');
	styleFixForOverflow.textContent = `
        #${id} canvas, 
        #${id} img, 
        #${id} video {
            overflow: hidden !important;
        }
    `;
	document.head.appendChild(styleFixForOverflow);

	// Rest of your original function
	let Location = [Lon, Lat];
	const baseMapTile = new ol.layer.Tile({
		source: new ol.source.OSM(),
		visible: true,
		title: 'OSMStandard'
	});

	const markerLayer = new ol.layer.Vector({
		style: new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: 'https://openlayers.org/en/latest/examples/data/icon.png'
			})
		})
	});

	const map = new ol.Map({
		view: new ol.View({
			center: (ol.proj.fromLonLat(Location)),
			zoom: zoomlevel,
		}),
		layers: [
			baseMapTile,
			markerLayer
		],
		target: id
	});

	return map;
}

/**
 * Set default marker
 * @param map
 * @param Lon
 * @param Lat
 */
function olSetNewMapPosition(map, Lon, Lat)
{
	const LonLat = new ol.proj.fromLonLat([Lon, Lat]);
	map.getView().setCenter(LonLat);

	const marker = new ol.Feature({
		geometry: new ol.geom.Point(LonLat),
		name: 'Marker',
	});

	const markerLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: [marker]
		}),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: 'https://openlayers.org/en/latest/examples/data/icon.png'
			})
		})
	});

	map.getLayers().removeAt(1);
	map.getLayers().insertAt(1, markerLayer);
}

/**
 * Remove all markers from the map
 * @param map
 */
function olRemoveAllMarkers(map)
{
	map.getLayers().getArray()
		.filter(layer => layer.values_.title !== 'OSMStandard')
		.forEach(layer => map.removeLayer(layer));

	// g_olMap.getLayers().forEach(function(layer) {
	//     if (typeof layer == ol.source.Vector)
	//         g_olMap.removeLayer(layer);
	// });
	//
	// g_olMap.getLayers().getArray()
	//     .filter(layer => layer.get('name') === 'Marker')
	//     .forEach(layer => g_olMap.removeLayer(layer));
}

/**
 * Move default geographical location on the map
 * @param map
 * @param zoomlevel
 */
function olMove2USCenter(map, zoomlevel=2) {
	const Lon = '-98.35';	// US Center location
	const Lat = '39.50';
	const LonLat = new ol.proj.fromLonLat([Lon, Lat]);
	map.getView().setCenter(LonLat);
	map.getView().setZoom(zoomlevel);
}

/**
 * Move the geographical location to new position
 * @param map
 * @param Lon
 * @param Lat
 */
function olMove2NewMapPosition(map, Lon, Lat) {
	const LonLat = new ol.proj.fromLonLat([Lon, Lat]);
	map.getView().setCenter(LonLat);
}

/**
 * Adding a marker on map
 * @param map
 * @param Lon
 * @param Lat
 * @param label
 */
function olAddNewMarker(map, Lon, Lat, label='')
{
	const LonLat = new ol.proj.fromLonLat([Lon, Lat]);
	// map.getView().setCenter(LonLat);

	const marker = new ol.Feature({
		geometry: new ol.geom.Point(LonLat),
		name: 'Marker',
	});

	const markerLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: [marker]
		}),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: 'https://openlayers.org/en/latest/examples/data/icon.png'
			}),
			text: new ol.style.Text({
				text: label,
				scale: 1.2,
				fill: new ol.style.Fill({
					color: '#black',
				})
			})
		})
	});

	map.getLayers().insertAt(1, markerLayer);
}
