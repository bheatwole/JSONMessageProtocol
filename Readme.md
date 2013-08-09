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
		t: 1376057995702715595,
		i: "425i9a98SGS9aD",
		r: 1256390734534,
		f: "com.jmp.user.create",
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

### m: Message
A wrapper around the main components of the message. This JSON object is used as the source of the signature (x) if the
message needs to be signed.

### t: Timestamp
The time in milliseconds since the UNIX epoch that the message was sent as calculated by the sender (which may or may
not be accurate). Implementations may decide whether or not to require an accuracy check on the timestamp. The time may
be specified as an integer meaning milliseconds, or as a string using [RFC 3339](http://tools.ietf.org/html/rfc3339).

### i: Message ID
An integer or string that uniquely identifies the message for this session (implementations may limit the size of the
field if desired). This field is optional, but if specified, the same value will be passed back to the sender in the
reply (r) field of the response message.

### r: Reply Message ID
If this message is in response to a message sent earlier (remote procedure call for example), the message ID (m) field
from the original source message will be copied to this (r) field. Implementations may decide if multiple replies to a
single source message are allowed or not.

### f: Function
The name of the 'function' to run on the caller. This defines the entry in a lookup table to identify both the schema
and route to use when passing the message on. This field may be an integer or a string.

### d: Data
An optional object that defines any function-specific parameters for the message. This field may be large depending upon
the data being transmitted. It will be validated against the schema retrieved when looking up the route for the function
(f) field.

## Schema
Below is the actual JSON-Schema used to validate the root message.

	Not Yet Implemented