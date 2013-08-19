var assert = require('assert');
var fs = require('fs');
var SchemaDirectoryWatcher = require('../lib/SchemaDirectoryWatcher');

describe('SchemaDirectoryWatcher', function() {

	describe('module', function() {
		it('should return a function to create a new SchemaDirectoryWatcher object, with one parameter', function() {
			assert(SchemaDirectoryWatcher);
			assert.strictEqual(typeof(SchemaDirectoryWatcher), "function");
			assert.equal(SchemaDirectoryWatcher.length, 1);
		});
	});
	
	describe('constructor', function() {
		it("should return an object with a 'fetchSchema' function", function() {
			var dw = new SchemaDirectoryWatcher("/tmp");
			assert(dw.fetchSchema);
			assert.strictEqual(typeof(dw.fetchSchema), "function");
			assert.equal(dw.fetchSchema.length, 2);
		});
		it("should throw an error if the directory does not exist", function() {
			assert.throws(function() {
				var dw = new SchemaDirectoryWatcher("/doesnt/exist");
			});
		});
		it("should throw an error if the directory is actually a file", function() {
			assert.throws(function() {
				var dw = new SchemaDirectoryWatcher("/etc/group");
			});
		});
	});
	
	describe('fetchSchema', function() {
		
		// Create a fake schema directory for the following tests
		fs.mkdirSync('/tmp/SchemaDirectoryTest');
		fs.mkdirSync('/tmp/SchemaDirectoryTest/levelOne');
		fs.writeFileSync("/tmp/SchemaDirectoryTest/fileOne.schema", '{ "title": "fileOne" }');
		fs.writeFileSync("/tmp/SchemaDirectoryTest/levelOne/fileTwo.schema", '{"title":"fileTwo"}');
		fs.symlinkSync('/tmp/SchemaDirectoryTest', '/tmp/symlinkTest');
		
		it("should have the correct test setup", function() {
			assert(fs.existsSync("/tmp/SchemaDirectoryTest"));
			assert(fs.existsSync("/tmp/SchemaDirectoryTest/fileOne.schema"));
			assert(fs.existsSync("/tmp/SchemaDirectoryTest/levelOne/fileTwo.schema"));
			assert(fs.existsSync("/tmp/symlinkTest"));
			assert(fs.existsSync("/tmp/symlinkTest/fileOne.schema"));
		});
		
		it("should send an error if the file cannot be found", function(done) {
			var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
			dw.fetchSchema("fileThree", function(err, schema) {
				assert(err);
				assert(!schema);
				done();
			});
		});
		
		it("should be able to find a first level file", function(done) {
			var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
			dw.fetchSchema("fileOne", function(err, schema) {
				assert(!err);
				assert(schema);
				assert.equal(schema.title, "fileOne");
				done();
			});
		});
		
		it("should be able to find a second level file", function(done) {
			var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
			dw.fetchSchema("levelOne.fileTwo", function(err, schema) {
				assert(!err);
				assert(schema);
				assert.equal(schema.title, "fileTwo");
				done();
			});
		});
		
		it("should be able to find a file with a symlink", function(done) {
			var dw = new SchemaDirectoryWatcher("/tmp/symlinkTest");
			dw.fetchSchema("fileOne", function(err, schema) {
				assert(!err);
				assert(schema);
				assert.equal(schema.title, "fileOne");
				done();
			});
		});
		
		it("should return the new version if the file changes", function(done) {
			var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
			dw.fetchSchema("fileOne", function(err, schema) {
				assert(!err);
				assert(schema);
				assert.equal(schema.title, "fileOne");
				
				fs.writeFileSync("/tmp/SchemaDirectoryTest/fileOne.schema", '{ "title": "changed!" }');
				setImmediate(function() {
					
					dw.fetchSchema("fileOne", function(err, schema) {
						assert(!err);
						assert(schema);
						assert.equal(schema.title, "changed!");
						done();
					});
				});
			});
		});
		
		it("should be able to find a new file", function(done) {
			// Remove the file
			fs.unlinkSync("/tmp/SchemaDirectoryTest/fileOne.schema");
				setImmediate(function() {
			
				var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
				dw.fetchSchema("fileOne", function(err, schema) {
				
					// The file doesn't exist at the moment.
					assert(err);
					assert(!schema);
					
					// Re-create it
					fs.writeFileSync("/tmp/SchemaDirectoryTest/fileOne.schema", '{ "title": "fileOne" }');
					setImmediate(function() {
						
						// It should exist now
						dw.fetchSchema("fileOne", function(err, schema) {
							assert(!err);
							assert(schema);
							assert.equal(schema.title, "fileOne");
							done();
						});
					});
				});
			});
		});
		
		it("should not be able to find a deleted file", function(done) {
			
			var dw = new SchemaDirectoryWatcher("/tmp/SchemaDirectoryTest");
			dw.fetchSchema("fileOne", function(err, schema) {
				assert(!err);
				assert(schema);
				assert.equal(schema.title, "fileOne");
				
				// Remove the file
				fs.unlinkSync("/tmp/SchemaDirectoryTest/fileOne.schema");
				setImmediate(function() {
				
					// It should exist now
					dw.fetchSchema("fileOne", function(err, schema) {
					
						// The file doesn't exist at the moment.
						assert(err);
						assert(!schema);
					
						// Re-create it for future tests
						fs.writeFileSync("/tmp/SchemaDirectoryTest/fileOne.schema", '{ "title": "fileOne" }');
						
						done();
					});
				});
			});
		});
		
		it("should cleanup after testing", function() {
			// Remove the fake schema
			fs.unlinkSync("/tmp/SchemaDirectoryTest/levelOne/fileTwo.schema");
			fs.rmdirSync('/tmp/SchemaDirectoryTest/levelOne');
			fs.unlinkSync("/tmp/SchemaDirectoryTest/fileOne.schema");
			fs.rmdirSync('/tmp/SchemaDirectoryTest');
			fs.unlinkSync("/tmp/symlinkTest");
			
			assert(!fs.existsSync("/tmp/SchemaDirectoryTest"));
			assert(!fs.existsSync("/tmp/symlinkTest"));
		});
	});
});