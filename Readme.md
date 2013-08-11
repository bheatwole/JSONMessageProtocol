# JSON Message Protocol
This project defines a protocol for sending, receiving and validating messages that are passed using the JSON format. It
is intended to be a transport-agnostic protocol that will support many transports including HTTP, websockets, regular
TCP sockets, UNIX sockets, thread-safe message queues, etc.

The initial implementation of the basic library is in node.js, but could use any language that supports JSON data (most
modern languages).

The protocol uses [JSON Schema](http://json-schema.org/) v4 to validate the structure of all messages.

The protocol includes validation of the sender and basic remote procedure call sematics. Below is a sample message:

	{
		v: "1.0",
		i: "425i9a98SGS9aD",
		r: 1256390734534,
		t: "com.jmp.user.create",
		d: {
			username: "wwonka",
			display: "Willy Wonka",
			email: "wwonka@wonka-factory.com",
		},
	}

The elements to this message are as follows:

### v: Version
The version of this protocol. Message may also have a version number inside the data (d) field, but this version number
establishes the schema that will be used to validate the message wrapper. Defaults to "1.0" if omitted.

### i: Message ID
An integer or string that uniquely identifies the message for this session (implementations may limit the size of the
field if desired). This field is optional, but if specified, the same value will be passed back to the sender in the
reply (r) field of the response message.

### r: Reply Message ID
If this message is in response to a message sent earlier (remote procedure call for example), the message ID (m) field
from the original source message will be copied to this (r) field. Implementations may decide if multiple replies to a
single source message are allowed or not.

### t: Type
The type of the message. This defines the entry in a lookup table to identify both the schema and route to use when
passing the message on. This field may be an integer or a string.

### d: Data
An optional object that defines any function-specific parameters for the message. This field may be large depending upon
the data being transmitted. It will be validated against the schema retrieved when looking up the route for the function
(f) field.

## Schema
Below is the actual JSON-Schema used to validate the root message.

	{
		"$schema": "http://json-schema.org/draft-04/schema#",
		"type": "object",
		"properties": {
			"v": {
				"enum": [ "1.0" ]
			},
			"i": {
				"type": [ "integer", "string"]
			},
			"r": {
				"type": [ "integer", "string"]
			},
			"t": {
				"type": [ "integer", "string"]
			},
			"d": {
				"type": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
			}
		},
		"additionalProperties": false,
		"required": [ "t" ]
	}

# node.js Implementation
Below are some of the details from the node.js implementation of this protocol.

## MessageHandler

### Options
These are the options that may be passed to the MessageHandler constructor. The options may be read or set after the
instance is constructed using the name of the option.

#### router
Specifies a function that will be called to route a message once it has passed validation. The signature of the function
must be:

	function(messageType, message, callback);
	
Parameters:

	messageType: The value of the Type ('t') field from the message. This is how the router should determine what code to
		run.
	message: The value of the Data ('d') field from the message. The router will typically pass this on to the function.
	callback: A function with the signature: callback(err, responseType, responseData). The router should call this 
		callback with any response to the original message. The 'err' parameter will be passed on to the code that read
		the message. If 'responseType' has a value, a response message with the appropriate ID will be created. If
		'responseData' also has a value, the Data ('d') field of the response message will be filled in. If the router
		does not call the callback, the message will be dropped.

#### fetchSchema
Specifies a function that will be called to retrieve the schema for a particular messageType. If no function is provided
the contents of all messages will be passed to the router with no validataion. The signature of the function must be:

	function(messageType, callback);
	
Parameters:

	messageType: The value of the Type ('t') field from the message. This is how the function should determine what
		schema to load.
	callback: A function with the signature: callback(err, schema). fetchSchema should call this function with the
		results of the schema lookup for the type. Providing a value for the 'err' parameter will stop message handling.
		The 'schema' parameter may either be a javascript object, a JSON string or null. If the 'schema' parameter is null
		no further schema validation will be performed on the message. Otherwise the entire message will be validated
		against the returned schema. This means that most schemas will duplicate at least a part of the JSON Message
		Protocol schema, but this is preferrable to storing out-of-band data indicating whether the Data ('d') field is
		required, optional or disallowed for each message type. If fetchSchema does not call this callback, the message
		will be dropped.

#### idGenerator
Specifies a sychronous function that will be called to generate the next message ID. The function should not take any
parameters and should return an integer or string that uniquely identifies the message.