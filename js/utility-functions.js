/**
 * Use the specified Object as a multi map. Insert
 * the value into an array for the key. If there
 * isn't an array for the key yet create one and
 * insert this value.
 *
 * @param {Object} object Object
 * @param {Object} key the key for the value
 * @param {Object} value a value corresponding to the key
 *
 */
function multiMapPut(object, key, value) {
	var valueArray = object[key];
	if (valueArray == null) {
		valueArray = [];
		object[key] = valueArray;
	}
	valueArray.push(value);
}

/**
 * Request JSON from the specified URL. When it returns
 * call the callback function specified with the params
 * specified.
 *
 * @param {String} url URL to request JSON from
 * @param {function} callback function to call when this returns
 * @param {Array} array of optional parameters for the callback
 * 		the callback function specifies what is accepted here.
 */
function getRequestJSON(url, callback, params) {
	$.ajax({
		type : 'GET',
		url : url,
		success : function(feed) {
			callback(feed, params);
		},

		dataType : 'json'
	});
}

/**
 * Set up jQuery to hide and show the loading element
 * when AJAX queries are running.
 */
function setUpAjax() {
	$.ajaxSetup({
		beforeSend : function() {
			$("#loading").show();
		},
		complete : function() {
			$("#loading").hide();
		}
	});
}


/**
 * Convert the String to title case and return it.
 * 
 * @param {String} str String to change to title case and return
 * 
 * http://stackoverflow.com/a/196991/786339
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}