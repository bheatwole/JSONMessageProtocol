
var createSchemaCache = function(cacheHit) {
	
	if (!cacheHit || "function" !== typeof(cacheHit) || 2 != cacheHit.length)
		throw new Error('You must provide a cacheHit function with the signature [function(messageType, callback)]');
	
	// Create the new instance.
	var instance = {
		'cacheHit': cacheHit,
	};
	
	// Put the actual cache in the closure
	var cache = {};
	
	// Returns true if the key is found
	instance.isCached = function(type) {
		return type in cache;
	};
	
	// Sets the value of the key
	instance.set = function(type, schema) {
		cache[type] = schema;
	};
	
	// Deletes the key from the cache
	instance.remove = function(type) {
		delete cache[type];
	};
	
	// Gets the specified value from the cache, or performs a cache hit if it is not found
	instance.get = function(type, callback) {
		if (type in cache) {
			callback(null, cache[type]);
		} else {
			instance.cacheHit(type, function(err, schema) {
				if (err) {
					callback(err);
				} else {
					cache[type] = schema;
					callback(null, schema);
				}
			});
		}
	};
	
	return instance;
};
	
module.exports = createSchemaCache;