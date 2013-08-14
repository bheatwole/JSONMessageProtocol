(function(window, undefined) {

	//
	// Utility functions
	//
	var possibleIdValues = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var baseIdGenerator = function makeId(length)
	{
		length = length || 8;
		var text = "";
		
		for( var i=0; i < length; i++ )
			text += possibleIdValues.charAt(Math.floor(Math.random() * possibleIdValues.length));
		
		return text;
	}
	
	var sendWithjQuery = function(client, message) {
		if (window.jQuery) {
			var $ = window.jQuery;
			
			$.ajax(client.url, {
				'dataType': "json",
				'data': JSON.stringify(message),
				'type': "POST",
				'contentType': "application/json",
				'success': function(responseMessage) {
					if (responseMessage && "t" in responseMessage) {
						client.handleServerMessage(responseMessage);
					}
				}
			});
		}
	};
	
	//
	// Main client API
	//
	
	// Create the base client. This is the object that the user will create. The possible options are:
	//		'url': REQUIRED: A string containing the URL of the server
	//		'idGenerator': optional: A function with the signature idGenerator() that will return the next message ID to use.
	//		'sendFunction': optional: A function used to send a message to the server. A default jQuery AJAX implementation
	//			will be used if not set.
	//		
	var makeClient = function(opts) {
		
		// Read the id generator or assign one of our own
		var idGenerator = opts.idGenerator || baseIdGenerator;
		
		var sendFunction = opts.sendFunction || sendWithjQuery;
		
		var self = {
			'url': opts.url,
		};
		
		// A list of callbacks that will be fired with every message received
		var onMessageCallback = [];
		
		// If a callback is requested when a message is sent, this is where it is stored.
		var responseCallbacks = {};
		
		// The handlers that are registered for a type of message.
		var messageTypeHandlers = {};
		
		// client.send(messageType, messageContents, callback). Also accepts send(messageType), send(messageType, callback)
		// send(messageType, messageContents). Sends the specified message to the server. If callback is specified, it will
		// be called the first time there is a response to the messge. The callback should have the signature:
		// callback(responseMessageType, responseMessageContents).
		self.send = function(messageType, messageContents, callback) {
			if (typeof messageContents === "function") {
				callback = messageContents;
				messageContents = null;
			}
			
			var message = {
				'i': idGenerator(),
				't': messageType
			};
			if (messageContents) {
				message.d = messageContents;
			}
			
			if (callback) {
				responseCallbacks[message.i] = callback;
			}
			
			sendFunction(self, message);
		};
		
		
		// client.onMessage(callback). Registers a callback that will be called on EVERY message received from the server.
		// The signature of the callback is: callback(fullMessage). The fullMessage parameter is the full message including
		// the wrapper as defined in the JSONMessageProtocol.
		self.onMessage = function(callback) {
			onMessageCallback.push(callback);
		};
		
		
		// client.registerType(responseMessageType, callback). Registers a callback that will be called whenever the server
		// sends a message of the specified type. This callback will be called after any specific response callback that
		// was requested for the source message. The callback should have the signature: callback(responseMessageContents).
		self.registerType = function(responseMessageType, callback) {
			if (!responseMessageType in messageTypeHandlers) {
				messageTypeHandlers[responseMessageType] = [];
			}
			messageTypeHandlers[responseMessageType].push(callback);
		};
		
		
		// client.handleServerMessage(fullMessage). Asks the client side of the code to handle a message that came from
		// the server. Typically used by the message transport code when a message is received. Routes the message to the
		// various callbacks.
		self.handleServerMessage = function(message) {
			// Pass the raw message to each callback that is registered
			for (var i = 0; i < onMessageCallback.length; i++) {
				onMessageCallback[i](message);
			}
			
			// If the message is in response to one we previously sent, fire that callback and then remove it.
			if (message.r && message.r in responseCallbacks) {
				responseCallbacks[message.r](message.t, message.d);
				delete responseCallbacks[message.r];
			}
			
			// If we have handlers for this particular type of message, call them.
			if (message.t in messageTypeHandlers) {
				var handlers = messageTypeHandlers[message.t];
				for (var i = 0; i < handlers.length; i++) {
					handlers[i](message.d);
				}
			}
		};
		
		return self;
	};
	
	// Create the JSONMessageProtocol namespace
	var JMP = {
		'Client': makeClient,
	};
	
	//
	// The code below handles the different kinds of module-loading code that we might encounter. The source is based on
	// a similar section in the jQuery code.
	//
	
	// If we're in a node.js-like environment (browserify for example), register using module.exports
	if (typeof module === "object" && module && typeof module.exports === "object") {
		module.exports = JMP;
	} else {
		// See if we're in an AMD-like environment
		if (typeof define === "function" && define.amd) {
			define( "JSONMessageProtocol", [], function () { return JMP; } );
		}
	}
	
	// If we're in a brower-like environment, register JSONMessageProtocol as a global environment.
	if (typeof window === "object" && typeof window.document === "object") {
		window.JSONMessageProtocol = JMP;
	}

})(window);