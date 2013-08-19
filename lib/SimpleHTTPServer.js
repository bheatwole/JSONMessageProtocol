var crypto = require('crypto');
var http = require('http');
var JMP = require('./main');

// Creates a simple HTTP server with a maximum message size.
var constructor = function(schemaDirectory, maxMessageSize) {
	var self = {
		'maxMessageSize': maxMessageSize || 1024  * 1024
	};
	
	// Set up route handling
	var routes = {};
	var handleRoute = function(type, message, callback) {
		if (!type in routes) {
			callback("Unknown message type");
		} else {
			routes[type](message, callback);
		}
	};
	
	// Set up a schema cache to hold the schemas that are registered.
	var schemas = new JMP.SchemaDirectoryWatcher(schemaDirectory);
	
	// Set up the message handler
	var handler = new JMP.MessageHandler({
		'router': handleRoute,
		'fetchSchema': schemas.fetchSchema,
		'idGenerator': function() { return crypto.randomBytes(12).toString('base64'); },
	});
	
	// This function handles each HTTP request. It throws out anything that's not
	// a POST or 'application/json'. It also completely ignores the URL and just
	// goes for the message in the JSON contents.
	var handleRequest = function(request, response) {
		// Only allow the POST method
		if (request.method !== "POST") {
			response.writeHead(405, "Only the POST method is allowed!");
			response.end();
			return;
		}
		
		// The only mime type allowed is application/json
		if (!('content-type' in request.headers) || -1 == request.headers['content-type'].indexOf("application/json")) {
			response.writeHead(415, "Only application/json data is allowed!");
			response.end();
			return;
		}
		
		// Get all the data from the request
		var data = "";
		request.on('data', function(chunk) {
			data = data + chunk;
			if (data.length > self.maxMessageSize) {
				response.writeHead(413, "The maximum message size is " + self.maxMessageSize + " bytes.");
				response.end();
			}
		});
		request.on('end', function() {
			handler.HandleMessage(data, function(err, message) {
				if (err) {
					response.writeHead(500, err);
					response.end();
				} else {
					if (message) {
						// We'll send back application/json
						response.setHeader("Content-Type", "application/json");
						response.write(JSON.stringify(message));
					}
					
					// Even if we don't have a message, close the connection
					response.end();
				}
			});
		});
	};
	var server = http.createServer(handleRequest);
	
	// This public function starts the HTTP server on the specified port
	self.listen = function(port) {
		server.listen(port);
	};
	
	// This public function registers a route with the server.
	self.registerRoute = function(type, callback) {
		routes[type] = callback;
	};
	
	return self;
};



// Export the constructor so that it can be used like this:
//		var SimpleHTTPServer = require('SimpleHTTPServer');
//		var server = new SimpleHTTPServer();
module.exports = constructor;