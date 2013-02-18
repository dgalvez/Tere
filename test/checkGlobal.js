var assert = require( 'assert' ),
    request = require( 'request' ),
    checkGlobal = require( '../src/checkGlobal' );

/*
 * Tests
 */

var scripts = [

    'var foo0 = "foo0";',
    'var foo1 = "foo1";',
    'var foo2 = "foo2";',
    'foo3 = "foo3"',
    'window.foo4 = "foo4"',
    '(function() { var global = (function() { return this; })(); global.foo5 = "foo5" })();',

], i, length;

for ( i = 0, length = scripts.length; i < length; i += 1 ) {

    assert.ok( checkGlobal( scripts[ i ], 'foo' + i ), 'foo' + i + ' in global' );

}

request.get( 'https://raw.github.com/jquery/qunit/v1.0.0/qunit/qunit.js', function( error, response, body ) {
    if ( ! error && response.statusCode === 200 ) {
	assert.ok( checkGlobal( body, 'QUnit' ) );
    }
});

request.get( 'https://raw.github.com/jquery/qunit/v1.5.0/qunit/qunit.js', function( error, response, body ) {
    if ( ! error && response.statusCode === 200 ) {
	assert.ok( checkGlobal( body, 'QUnit' ) );
    }
});

request.get( 'https://raw.github.com/jquery/qunit/v1.8.0/qunit/qunit.js', function( error, response, body ) {
    if ( ! error && response.statusCode === 200 ) {
	assert.ok( checkGlobal( body, 'QUnit' ) );
    }
});

request.get( 'https://raw.github.com/jquery/qunit/v1.10.0/qunit/qunit.js', function( error, response, body ) {
    if ( ! error && response.statusCode === 200 ) {
	assert.ok( checkGlobal( body, 'QUnit' ) );
    }
});

request.get( 'https://raw.github.com/jquery/qunit/v1.11.0/qunit/qunit.js', function( error, response, body ) {
    if ( ! error && response.statusCode === 200 ) {
	assert.ok( checkGlobal( body, 'QUnit' ) );
    }
});
