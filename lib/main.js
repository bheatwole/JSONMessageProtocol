var JaySchema = require('jayschema');

var messageValidator = new JaySchema();
var messageSchema = {
	"$schema": "http://json-schema.org/draft-04/schema#",
	"type": "object",
	"properties": {
		"v": {
			"enum": [ "1.0" ],
		},
		"i": {
			"type": [ "integer", "string"],
		},
		"r": {
			"type": [ "integer", "string"],
		},
		"t": {
			"type": [ "integer", "string"],
		},
		"d": {
			"type": [ "array", "boolean", "integer", "null", "number", "object", "string" ],
		},
	},
	"additionalProperties": false,
	"required": [ "t" ]
};


// Converts the specified parameter to a javascript object if necessary. Parses string values as JSON
var jsonToObject = function(param) {
	var json = param;
	if (typeof(json) === "string") {
		json = JSON.parse(json);
	}
	if (typeof(json) !== "object") {
		throw "You must provide a valid JSON object or JSON string";
	}
	
	return json;
}

var routeMessage = function(instance, json, callback) {
	
	var message = null;
	if ('d' in json)
		message = json.d;
		
	instance.router(json.t, message, function(err, responseType, responseData) {
		if (err) {
			callback(err);
		} else if (responseType) {
			var sendBack = {
				't': responseType
			};
			if (responseData)
				sendBack.d = responseData;
			if (json.i)
				sendBack.r = json.i;
			if (instance.idGenerator)
				sendBack.i = instance.idGenerator();
			
			callback(null, sendBack);
		}
	});
}


var createMessageHandler = function(options) {
	
	options = options || {};
	if (!options.router)
		throw new Error('You must provide options.router with the signature [function(messageType, message, callback)]');
	
	// Create the new instance.
	var instance = {
		'router': options.router,
		'fetchSchema': options.fetchSchema || null,
		'idGenerator': options.idGenerator || null,
	};
		
	// Handles a message
	instance.HandleMessage = function(msg, callback) {
		
		// Convert the msg into a json object
		var json = msg;
		if (typeof(json) === "string") {
			try {
				json = JSON.parse(json);
			} catch (err) {
				callback(err);
				return;
			}
		}
		if (typeof(json) !== "object") {
			callback("You must provide a valid JSON object or JSON string to HandleMessage.");
			return;
		}
		
		// Synchronously validate the base parts of the message since we know it doesn't have dependancies that could
		// cause a long validation.
		var baseValidationErrors = messageValidator.validate(json, messageSchema);
		if (baseValidationErrors.length) {
			callback("This message does not conform to version 1.0 of the JSON Message Protocol.");
			return;
		}
		
		// If we have a fetchSchema option, fetch the message schema and attempt to validate it
		if (instance.fetchSchema) {
			instance.fetchSchema(json.t, function(err, schema) {
				if (err) {
					callback(err);
				} else if (schema) {
					var messageValidationErrors = messageValidator.validate(json, schema);
					if (messageValidationErrors.length) {
						callback("This message failed internal schema validation for a type (" + json.t + ") message.");
						return;
					}
					
					routeMessage(instance, json, callback);
				} else {
					// There was no schema, just route the message
					routeMessage(instance, json, callback);
				}
			});
		} else {
			routeMessage(instance, json, callback);
		}
	};
	
	return instance;
};
	
exports.MessageHandler = createMessageHandler;
exports.SchemaCache = require('SchemaCache');
exports.SimpleHTTPServer = require('SimpleHTTPServer');