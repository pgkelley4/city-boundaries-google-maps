## City Boundaries With Google Maps

This is a small example web app to illustrate adding city boundaries
(limits) to Google Maps. The city data is read from the OpenStreetMap
Overpass API:

http://wiki.openstreetmap.org/wiki/Overpass_API

## Breakdown

The JavaScript files used in this project are as follows:

### google.maps.Polygon.getBounds.js 
Polygon getBounds extension from google. Used to get the bounds of the
final Polygon created for the cities boundaries and then zoom the map
to that polygon.

### jquery-1.10.2.js
Used for AJAX queries.

### city-boundaries-googlemaps.js
The main JavaScript file that finds the city boundaries and  displays 
them on a Google Maps canvas. Creates a legend with the city entered.

### utility-functions.js
A few small utilities.

### relation-in-order.js
This JavaScript gets the boundary relation specified and constructs an
array of paths. These paths consist of the nodes that are latitude 
and longitude points on the boundary.

Please see the Overpass background section for a discussion on relations,
ways and nodes.

To construct the paths this script does the following:
```
1 grab any unprocessed way
2 add all nodes of way to new path
3 mark way as processed
4 find way that either starts or ends with the last node of the previous way
5 add all nodes of way forward or reverse depending on previous step
6 repeat steps 3 - 5 until no more connecting ways found, this is a complete path
7 repeat steps 1 - 6 until no more ways found at all
```

This must be done because neither the ways nor the relation are in order.

This script does not do anything special for inner ways as Google Maps will
handle discovering that a way is contained within another and display it
properly. If not using Google Maps you will have to find if paths are 
contained within others. I wrote a script to do that here:

https://github.com/pgkelley4/line-segments-intersect

## How to use

You must include all the Javascript files in the js folder in your HTML page.
To run this example, download the project and open the index.html file.

## Overpass background and Overpass QL used

The OpenStreetMap Overpass API is a read-only API that provides OSM data.

The relevant OpenStreetMap data is organized into relations, ways and nodes.

* Relation - http://wiki.openstreetmap.org/wiki/Relation
* Node - http://wiki.openstreetmap.org/wiki/Node
* Way - http://wiki.openstreetmap.org/wiki/Way

I find the relation, read its ways into memory and then add all their nodes 
into our paths in the correct order.

The Overpass QL is used to query the Overpass API. Because the OSM data is 
incosistently labeled I have two sets of queries to find the correct area. 
These could certainly be tweaked/changed as I know they don't work all 
the time. See bugs section for more details.

Query directly for the area:
```
area[name=%22" + cityName + "%22][%22is_in:state_code%22=%22" + stateName + "%22];foreach(out;);
```

If that doesn't work also query for associated nodes, and return each node's 
associated areas:
```
node[name=%22" + cityName + "%22][%22is_in%22~%22" + stateName + "%22];foreach(out;is_in;out;);
```

Then get the relation ID from the area ID by subtracting 3600000000 from it.

To get the relation from its ID:
```
(relation(" + relationID + ");>;);out;
```

## Notes

This can handle cities that are made up of multiple polygons, for example
New York, NY. It can also handle cities with holes in them, for example
Detroit, MI.

Sometimes the Overpass API goes much faster than other times. I use a busy
indicator in the example to show when pinging the Overpass servers.

## Bugs

The OpenStreetMap city boundary data is missing for some cities. Even some
big ones like Los Angeles and Dallas. There isn't much I can do about this.

Right now, this is more of a starting point, more work must be done to fix 
the queries to get the data for cities that are available but aren't found.
An example is Houston, TX.

There are still a few issues with drawing polygons with Google Maps as it 
seems to mess up occasionally. Currently, I am only aware of issues with 
San Antonio and I believe this is becuase it is messing up on some of the 
holes (or in OSM terminology, the inner ways of the boundary relation).