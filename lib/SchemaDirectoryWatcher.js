// The SchemaDirectoryWatcher class implements one possible file-based schema store. When a cache miss is found, it
// parses the message type to determine which file to load and loads it into the cache. It also watches the directory
// for changes to files and removes them from the cache if any are changed (ensuring a cache miss the next time that
// schema is requested).

var fs = require('fs');
var path = require('path');
var SchemaCache = require('./SchemaCache');

// SchemaDirectoryWatcher(rootDirectory)
module.exports = function(rootDirectory) {
	
	// Confirm that the directory exists and actually is a directory
	var stat = fs.statSync(rootDirectory);
	if (!stat.isDirectory()) {
		throw new Error("The 'rootDirectory' parameter must be an existing parameter");
	}
	
	var cache;
	var internalFetchSchema = function(messageType, callback) {
		
		// Replace any '.' characters with the seperator.
		var filename = messageType.replace(".", path.sep);
		
		// Turn the messageType into a path
		filename = path.join(rootDirectory, filename + ".schema");
		
		// Attempt to read the file
		try {
			var schema = fs.readFileSync(filename, { 'encoding': 'utf8' });
			
			// Watch the file for any changes
			fs.watch(filename, { persistent: false }, function(event, file) {
				cache.remove(messageType);
			});
			
			callback(null, JSON.parse(schema));
		} catch (e) {
			// Return an error if we couldn't find a file for the message type
			callback("Unknown message type");
		}
		
	};
	
	// Create the schema cache
	cache = new SchemaCache(internalFetchSchema);
	
	var self = {
	};
	
	self.fetchSchema = cache.get;
	
	return self;
}