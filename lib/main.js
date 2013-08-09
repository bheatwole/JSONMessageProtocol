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
			"type": "object",
		},
	},
	"additionalProperties": false,
	"required": [ "t" ]
};


var createMessageHandler = function(options) {
	
	// Create the new instance.
	var instance = {
		'options': options || {},
	};
	
	// Verify the options.
	instance.options.allowsMultipleResponses = instance.options.allowsMultipleResponses || true;
	if (!instance.options.router)
		throw new Error('You must provide options.router with the signature [function(messageType, message, callback)]');
		
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
		
		// Synchronously validate the base parts of the message since we know it doesn't have dependancies
		var baseValidationErrors = messageValidator.validate(json, messageSchema);
		if (0 != baseValidationErrors.length) {
			callback("This message does not conform to version 1.0 of the JSON Message Protocol.");
			return;
		}
	};
	
	
	return instance;
};
	
exports.MessageHandler = createMessageHandler;