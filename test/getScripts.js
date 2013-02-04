var assert = require( 'assert' ),
    getScripts = require( '../src/getScripts' );

/*
 * Tests
 */

var htmls = [
    '<html><head><script src="foo.js"></script></head><body></body></html>',
    '<html><head><script src="foo.js"></script><script src=bar.js></script></head><body></body></html>',
    '<html><head></head><body><script src="hola.js"></script><script src=baz.js></script></body></html>',
];

getScripts(htmls[ 0 ], function( scripts ) {
    assert.equal( scripts.toString(), [ 'foo.js' ].toString() );
});

getScripts(htmls[ 1 ], function( scripts ) {
    assert.equal( scripts.toString(), [ 'foo.js', 'bar.js' ].toString() );
});

getScripts(htmls[ 2 ], function( scripts ) {
    assert.equal( scripts.toString(), [ 'hola.js', 'baz.js' ].toString() );
});





