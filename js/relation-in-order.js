/**
 * Construct the paths from the relation specified JSON. The paths
 * will consist of nodes in the order that they connect through the
 * ways.
 * 
 * Calls the callback specified with the following parameter:
 * 2-d array, an array of paths (arrays) of nodes and the parameters
 * passed in.
 * 
 * Structure of OSM JSON and vaguely similar algorithm described 
 * at the the following:
 * http://wiki.openstreetmap.org/wiki/Relation:multipolygon/Algorithm
 * 
 * @param {JSON} relationJSON JSON response from OSM
 * @param {Array} params list of any parameters with the last 
 * 	being the callback to execute when this is finished. The rest
 * 	of the parameters will be passed to the callback.
 */
function constructRelationInOrder(relationJSON, params) {
	var callback = params.pop();
	
	/*
	 * Read all the nodes, ways and relations found into memory in
	 * structures convenient for retrieval later.
	 */
	var elements = relationJSON.elements;
	var nodes = {};
	var ways = {};
	var waysByStartNodeRef = {};
	var waysByEndNodeRef = {};
	for (i in elements) {
		if (elements[i].type == "way") {
			var way = elements[i];
			ways[way.id] = way;
			multiMapPut(waysByStartNodeRef, way.nodes[0], way);
			multiMapPut(waysByEndNodeRef, way.nodes[way.nodes.length - 1], way);
		} else if (elements[i].type == "node") {
			nodes[elements[i].id] = elements[i];
		}
	}

	/*
	 * Add all nodes of all ways, when a way ends see if there is
	 * the same node starting or ending another way, if so, add
	 * all the nodes of that way forwards if the nodes starts the way
	 * or backwards if the node ends the next way.
	 */
	var completedPaths = [];
	var nodesOfPath = [];
	// Was initially start at beginging of relation, but the ways aren't in order after this.
	// should post to openstreemap forums and see why this is
	// var startWay = relation.members[0];
	var currentWayID;
	for (currentWayID in ways) break;
	var forwardTraversal = true;
	while (currentWayID != null) {
		var currentWay = ways[currentWayID];
		delete ways[currentWayID];
		
		if (forwardTraversal) {
			for (y in currentWay.nodes) {
				nodesOfPath.push(nodes[currentWay.nodes[y]]);
			}
			var endNode = currentWay.nodes[currentWay.nodes.length - 1];
		} else {
			for (var y = currentWay.nodes.length - 1; y >= 0; y--) {
				nodesOfPath.push(nodes[currentWay.nodes[y]]);
			}
			var endNode = currentWay.nodes[0];
		}

		var nextWayID = null;
		var wayArray = waysByStartNodeRef[endNode];
		for (x in wayArray) {
			if (wayArray[x].id != currentWay.id && wayArray[x].id in ways) {
				nextWayID = wayArray[x].id;
				forwardTraversal = true;
				break;
			}
		}
		if (nextWayID == null) {
			wayArray = waysByEndNodeRef[endNode];
			for (x in wayArray) {
				if (wayArray[x].id != currentWay.id && wayArray[x].id in ways) {
					nextWayID = wayArray[x].id;
					forwardTraversal = false;
					break;
				}
			}
		}

		// no connecting way found, must be complete
		if (nextWayID == null) {
			completedPaths.push(nodesOfPath);
			nodesOfPath = [];
			for (nextWayID in ways) break;
			forwardTraversal = true;
		}

		currentWayID = nextWayID;
	}

	callback(completedPaths, params);
}

/**
 * Get the relation as array of paths of nodes. Then call the 
 * specified callback function with the array of paths as a 
 * parameter. Therefore, callback specified must accept an array.
 * 
 * @param {String} relationID ID of the relation to retrieve
 * @param {function} callback funciton, that is called when the
 * 		relation has been retrieved and processed. Must accept a
 * 		2-d array, an array of paths (arrays) of nodes.
 * @param {Array} params an array of parameters to pass to the
 * 		specified callback.
 */
function getRelationInOrder(relationID, callback, params) {
	params.push(callback);
	getRequestJSON(getOSMCityRelationURL(relationID), constructRelationInOrder, params);
}

/**
 * Get the OpenStreetMap URL for a specific relation as a String.
 *
 * @param {String} relationID ID of the relation to retrieve
 */
function getOSMRelationURL(relationID) {
	return "http://overpass-api.de/api/interpreter?data=[out:json];(relation(" + relationID + ");>;);out;";
}
