var assert = require( 'assert' ),
    express = require('express'),
    app = express(),
    finished = 0,
    findTestFramework = require( '../src/findTestFramework' );

app.listen( 4444 );

app.get( '/foo/a.js', function( req, res ) {

    var body = 'window.QUnit = {};';

    res.setHeader( 'Content-Type', 'text/javascript' );
    res.setHeader( 'Content-Length', body.length );
    res.end( body );

});

app.get( '/foo/b.js', function( req, res ) {

    var body = 'window.a = {};';

    res.setHeader( 'Content-Type', 'text/javascript' );
    res.setHeader( 'Content-Length', body.length );
    res.end( body );

});

app.get( '/foo/c.js', function( req, res ) {

    var body = 'window.QUnit = {};';

    res.setHeader( 'Content-Type', 'text/javascript' );
    res.setHeader( 'Content-Length', body.length );
    res.end( body );

});

var killServer = function() {

    if ( finished === 4 ) {

	process.exit( 0 );

    }

};

/*
 * Tests
 */

findTestFramework( [ 'a.js' ], 'http://localhost:4444/foo', function( src ) {
    finished += 1;
    assert.equal( src, 'a.js' );
    killServer();
});

findTestFramework( [ 'b.js', 'c.js' ], 'http://localhost:4444/foo', function( src ) {
    finished += 1;
    assert.equal( src, 'c.js' );
    killServer();
});

findTestFramework( [ 'b.js' ], 'http://localhost:4444/foo', function( src ) {
    finished += 1;
    assert.equal( src, false );
    killServer();
});

findTestFramework( [ 'd.js' ], 'http://localhost:4444/foo', function( src ) {
    finished += 1;
    assert.equal( src, false );
    killServer();
});

