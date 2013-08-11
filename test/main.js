var assert = require('assert');
var JMP = require('../lib/main');

describe('JSONMessageProtocol', function() {
	describe('module', function() {
		it('should return an object containing a MessageHandler class', function() {
			assert(JMP.MessageHandler);
			assert.strictEqual(typeof(JMP.MessageHandler), "function");
		});
	});
	
	var MessageHandler = JMP.MessageHandler;
	
	describe('MessageHandler', function() {
		describe('constructor', function() {
			it("should take an 'options' parameter and return an object containing a HandleMessage function and the options", function() {
				// The constructor should take one parameter
				assert.equal(MessageHandler.length, 1);
				
				var handler = new JMP.MessageHandler({
					'router': true,
					'fetchSchema': true,
					'idGenerator': true,
					'junk': true,
				});
				
				assert(handler);
				assert(handler.HandleMessage);
				assert.strictEqual(typeof(handler.HandleMessage), "function");
				assert(handler);
				assert(handler.router);
				assert(handler.fetchSchema);
				assert(handler.idGenerator);
			});
			it('should throw an exception if the "router" parameter is null or undefined', function() {
				assert.throws(function() {
						new MessageHandler({
							// don't provide this: 'router': true,
							'fetchSchema': true,
							'idGenerator': true,
							'junk': true,
						});
					}
				);
			});
			it('should not throw an exception if the "fetchSchema" parameter is null or undefined', function() {
				assert.doesNotThrow(function() {
						new MessageHandler({
							'router': true,
							// don't provide this: 'fetchSchema': true,
							'idGenerator': true,
							'junk': true,
						});
					}
				);
			});
			it('should not throw an exception if the "idGenerator" parameter is null or undefined', function() {
				assert.doesNotThrow(function() {
						new MessageHandler({
							'router': true,
							'fetchSchema': true,
							// don't provide this: 'idGenerator': true,
							'junk': true,
						});
					}
				);
			});
		});
		
		describe('HandleMessage', function() {
			var nextId = 1;
			var handler = new MessageHandler({
				'router': function(messageType, message, callback) {
					switch (messageType) {
						case "echo":
							callback(null, "echo", message);
							break;
						
						default:
							callback("Unknown message type", null);
							break;
					}
				},
				'fetchSchema': function(messageType, callback) {
					switch (messageType) {
						case "echo":
							callback(null, {
								"$schema": "http://json-schema.org/draft-04/schema#",
								"type": "object",
								"properties": {
									"d": {
										"type": "string"
									}
								},
								"additionalProperties": true,
								"required": [ "d" ]
							});
							break;
						
						default:
							callback("Unknown message type", null);
							break;
					}
				},
				'idGenerator': function() { return nextId++; },
			});
				
			it('should take a string and a callback as parameters', function() {
				assert.equal(handler.HandleMessage.length, 2);
			});
			it("should send an error if the string is not JSON", function(done) {
				handler.HandleMessage("<html>This is not JSON</html>", function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the JSON does not have an 't' field or it is not an integer or string", function(done) {
				var json = {
					notT: "The key is not 't'",
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the 't' field is not an integer or string", function(done) {
				var json = {
					t: { 'oops': "It's an object" },
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the 'v' field is not '1.0'", function(done) {
				var json = {
					t: "echo",
					v: "1.1",
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the 'i' field is not a string or integer", function(done) {
				var json = {
					t: "echo",
					i: { 'oops': "It's an object" },
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the 'r' field is not a string or integer", function(done) {
				var json = {
					t: "echo",
					r: { 'oops': "It's an object" },
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if there are unknown fields", function(done) {
				var json = {
					t: "echo",
					junk: true
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if fetchSchema returns an error", function(done) {
				var json = {
					t: "unknown",
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send an error if the 'd' field does not pass schema validation", function(done) {
				var json = {
					t: "echo",
					d: {
						"opps": "This is an object, not a string; so it should not validate."
					}
				};
				handler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should pass the message type and 'd' field to the router function", function(done) {
				var json = {
					t: "echo",
					d: "A message to validate"
				};
				handler.HandleMessage(json, function(err, message) {
					assert.strictEqual(err, null);
					assert.equal(message.d, "A message to validate");
					done();
				});
			});
			it("should send an error if the router function returns an error", function(done) {
				var badHandler = new MessageHandler({
					'router': function(a, b, callback) { callback('error'); },
					'fetchSchema': handler.fetchSchema,
					'idGenerator': handler.idGenerator,
				});
			
				var json = {
					t: "echo",
					d: "A message to validate"
				};
				badHandler.HandleMessage(json, function(err, message) {
					assert(err);
					done();
				});
			});
			it("should send a message if the router function returns a message", function(done) {
				var json = {
					t: "echo",
					d: "A message to validate"
				};
				handler.HandleMessage(json, function(err, message) {
					assert.strictEqual(err, null);
					assert.equal(message.d, "A message to validate");
					done();
				});
			});
			it("should assign a message ID if the idGenerator is not null", function(done) {
				var json = {
					t: "echo",
					d: "A message to validate"
				};
				handler.HandleMessage(json, function(err, message) {
					assert.strictEqual(err, null);
					assert(message.i > 0);
					done();
				});
			});
			it("should include a reply ID if the original message included a message ID", function(done) {
				var json = {
					i: "abcdef",
					t: "echo",
					d: "A message to validate"
				};
				handler.HandleMessage(json, function(err, message) {
					assert.strictEqual(err, null);
					assert.equal(message.r, "abcdef");
					done();
				});
			});
		});
	});
});