var assert = require('assert');
var sc = require('../lib/SchemaCache');


describe('SchemaCache', function() {

	describe('module', function() {
		it('should return a function to create a new SchemaClass object', function() {
			assert(sc);
			assert.strictEqual(typeof(sc), "function");
		});
	});
	
	describe('constructor', function() {
		it('should take a cacheHit function and return an object with multiple functions', function() {
			var cache = new sc(function(t, cb) {});
			
			assert(cache);
			assert(cache.cacheHit);
			assert(cache.isCached);
			assert(cache.get);
			assert(cache.set);
			assert(cache.remove);
		});
	});
	
	describe('isCached', function() {
		it('should return true if the schema for the specified type is cached.', function() {
			var cache = new sc(function(t, cb) {});
			cache.set('com.wonka.initialize', { });
			
			assert(cache.isCached('com.wonka.initialize'));
		});
		it('should return true even if the schema is null', function() {
			var cache = new sc(function(t, cb) {});
			cache.set('com.wonka.initialize', null);
			
			assert(cache.isCached('com.wonka.initialize'));
		});
		it('should return false if the schema is not cached', function() {
			var cache = new sc(function(t, cb) {});
			
			assert(!cache.isCached('com.wonka.initialize'));
		});
	});
	
	describe('get', function() {
		it('should perform a cache hit if the type is not cached', function(done) {
			var hits = 0;
			var hitCache = function(type, callback) {
				hits++;
				callback(null, type + "Schema");
			};
			
			var cache = new sc(hitCache);
			cache.get("myType", function(err, schema) {
				assert.ifError(err);
				assert.equal(schema, "myTypeSchema");
				assert.equal(hits, 1);
				done();
			});
		});
		it('should return the cached value if the type is cached', function(done) {
			var hits = 0;
			var hitCache = function(type, callback) {
				hits++;
				callback(null, type + "Schema");
			};
			
			var cache = new sc(hitCache);
			cache.get("myType", function(err, schema) {
				assert(cache.isCached('myType'));
				cache.get("myType", function(err, schema) {
					assert.ifError(err);
					assert.equal(schema, "myTypeSchema");
					// still just one hit!
					assert.equal(hits, 1);
					done();
				});
			});
		});
	});
	
	describe('set', function() {
		it('should set the value of the type in the cache', function() {
			var cache = new sc(function(t, cb) {});
			cache.set('com.wonka.initialize', { });
			
			assert(cache.isCached('com.wonka.initialize'));
		});
	});
	
	describe('remove', function() {
		it('should cause the type to no longer have a schema in the cache', function() {
			var cache = new sc(function(t, cb) {});
			cache.set('com.wonka.initialize', { });
			
			assert(cache.isCached('com.wonka.initialize'));
			cache.remove('com.wonka.initialize');
			assert(!cache.isCached('com.wonka.initialize'));
		});
		it('should cause a cache hit if the type is accessed again', function(done) {
			var hits = 0;
			var hitCache = function(type, callback) {
				hits++;
				callback(null, type + "Schema");
			};
			
			var cache = new sc(hitCache);
			cache.get("myType", function(err, schema) {
				assert.ifError(err);
				assert.equal(schema, "myTypeSchema");
				assert.equal(hits, 1);
			});
			cache.remove("myType");
			cache.get("myType", function(err, schema) {
				assert.ifError(err);
				assert.equal(schema, "myTypeSchema");
				assert.equal(hits, 2);	// two hits this time, because it was removed
				done();
			});
		});
	});
});