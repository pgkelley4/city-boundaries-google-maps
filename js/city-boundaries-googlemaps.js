/**
 * Small script to draw boundaries of a city on google maps.
 *
 * Retrieves city boundary data from openstreetmap
 * http://wiki.openstreetmap.org/wiki/Overpass_API
 *
 * @author Peter Kelley, August 12 2013
 */

var BOUNDARY_COLORS = ['FF0000'];
var BOUNDARY_COLOR_COORDINATES_PARAM = 0;

var map;
var allOverlays = [];
var lengendContent = [];

google.maps.event.addDomListener(window, 'load', initialize); 

/**
 * Find the city boundaries and display on the google map.
 *
 */
function loadCityLimits() {
	// clear any previous polygons
	while (allOverlays[0]) {
		allOverlays.pop().setMap(null);
	}
	lengendContent = [];
	map.controls[google.maps.ControlPosition.RIGHT_TOP].clear();

	var cityText = document.getElementById('cityTextInput');
	var splitCity = cityText.value.split(",");
	if (splitCity.length != 2) {
		alert("Must enter a city in the format: CITY, STATE.");
		return;
	}

	var city = toTitleCase(splitCity[0].trim());
	var state = splitCity[1].trim().toUpperCase();

	var legendContents = [];

	var params = [];
	params[BOUNDARY_COLOR_COORDINATES_PARAM] = BOUNDARY_COLORS[0];
	getRequestJSON(getOSMAreaForCityURL(city, state), processCityArea, params);

	var cityLegend = [city + ", " + state, params[BOUNDARY_COLOR_COORDINATES_PARAM]];
	legendContents.push(cityLegend);

	addLegend(legendContents);
}

/**
 * Add a legend to the google map. This iterates through the legendContents
 * and creates legend entries for each elements of the array.
 *
 * @param {Array} legendContents array of the legend contents to to following
 * 		specifications:
 * legendContents[i][0] - Name of the legend entry
 * legendContents[i][1] - The color for the entry
 *
 * i specifies the entry number
 *
 */
function addLegend(legendContents) {
	// Create the legend and display on the map
	// https://developers.google.com/fusiontables/docs/samples/legend
	var legend = document.createElement('div');
	legend.id = 'legend';
	lengendContent.unshift('<h3>Cities</h3>');
	for (x in legendContents) {
		lengendContent.push('<p><div class="color color' + legendContents[x][1] + '"></div>' + legendContents[x][0] + '</p>');
	}
	legend.innerHTML = lengendContent.join('');
	legend.index = 1;
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(legend);
}

/**
 * When the window has loaded, do basic initilization including
 * AJAX setup and Google maps set up including setting the 
 * focus on the continental US
 */
function initialize() {
	$("#loading").hide();
	setUpAjax();
	
	var mapOptions = {
		zoom : 4,
		center : new google.maps.LatLng(37.09024, -95.712891),
		streetViewControl : false,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

/**
 * Get the OpenStreetMap URL for the area of a city.
 *
 * @param {String} cityName Name of the city to retrieve the area for
 * @param {String} stateName Name of the state to retrieve the area for
 */
function getOSMAreaForCityURL(cityName, stateName) {
	return "http://overpass-api.de/api/interpreter?data=[out:json];area[name=%22" + cityName + 
		"%22][%22is_in:state_code%22=%22" + stateName + "%22];foreach(out;);node[name=%22" + cityName + 
		"%22][%22is_in%22~%22" + stateName + "%22];foreach(out;is_in;out;);";
	// case insensitive, really slow!
	// area[name~%22" + cityName +
	// "%22, i][%22is_in:state_code%22~%22" + stateName + "%22, i];foreach(out;);node[name~%22" + cityName +
	// "%22, i][%22is_in%22~%22" + stateName + "%22];foreach(out;is_in;out;);
	// could directly ping for relation
	//rel[name=Boston]["is_in:state_code"~MA];foreach(out;);
}

/**
 * Get the OpenStreetMap URL for a specific relation.
 *
 * @param {String} relationID ID of the relation to retrieve
 */
function getOSMCityRelationURL(relationID) {
	return "http://overpass-api.de/api/interpreter?data=[out:json];(relation(" + relationID + ");>;);out;";
}

/**
 * Get the relation ID from the area JSON, request the relation and
 * construct the city boundaries from it.
 *
 * @param {JSON} areaJSON JSON area response from OSM
 * @param {Array} params list of any parameters to pass on to
 * 			city boundary callback constructMapFromBoundaries
 */
function processCityArea(areaJSON, params) {
	for (x in areaJSON.elements) {
		// if find something that is level 8
		// if find something labelled city
		// if find something that has the exact name
		if ((areaJSON.elements[x].tags.admin_level == "8" && 
				areaJSON.elements[x].tags.border_type == null) || 
				areaJSON.elements[x].tags.border_type == "city") {
			var areaID = areaJSON.elements[x].id;
			// transform to relation id, and get relation
			var relationID = areaID - 3600000000;

			getRelationInOrder(relationID, constructMapFromBoundaries, params);
			return;
		}
	}
	alert("Couldn't retrieve the city limits for a city, they are either missing from OpenStreetMap, not labeled " + 
		"consistently or the city entered is not valid.");
	console.log("Failed to find city border from OSM.");
}

/**
 * Construct the polygons on the google map from the paths
 * and parameters specified. This is a callback that accepts
 * the parameters given to getRelationInOrder.
 *
 * @param {Array} paths Array of paths, which are an array of
 * 		OSM nodes.
 * @param {Array} params The parameters given to getRelationInOrder.
 * 		Of the format:
 *			params[BOUNDARY_COLOR_COORDINATES_PARAM]; - Color to
 * 			make the polygon.
 */
function constructMapFromBoundaries(paths, params) {
	var color = params[BOUNDARY_COLOR_COORDINATES_PARAM];

	for (i in paths) {
		var path = paths[i];
		for (j in path) {
			var node = path[j];
			path[j] = new google.maps.LatLng(node.lat, node.lon);
		}
	}

	// google maps api can create multiple polygons with one create call
	// and returns one object. Also can handle inner ways (holes)
	var polygon = createPolygon(paths, color);

	// set map zoom and location to new polygons
	map.fitBounds(polygon.getBounds());
}

/**
 * Create a polygon on the google map of the specified
 * paths and color.
 *
 * @param {Array} paths Array of coordinates (google.maps.LatLng)
 * 		for this polygon
 * @param {String} The hex value for the color of the polygon,
 * 		omitting the # character
 */
function createPolygon(paths, color) {
	newPolygon = new google.maps.Polygon({
		paths : paths,
		strokeColor : "#" + color,
		strokeOpacity : 0.8,
		strokeWeight : 2,
		fillColor : "#" + color,
		fillOpacity : 0.35,
		draggable : true
		// geodisc: true
	});

	newPolygon.setMap(map);

	allOverlays.push(newPolygon);

	return newPolygon;
}