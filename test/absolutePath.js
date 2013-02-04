var assert = require( 'assert' ),
    absolutePath = require( '../src/absolutePath' );

/*
 * Tests
 */

var cases = [

    { base: 'http://google.com', path: '/foo/bar/baz.js', expected: 'http://google.com/foo/bar/baz.js' },
    { base: 'http://google.com/', path: '/foo/bar/baz.js', expected: 'http://google.com/foo/bar/baz.js' },
    { base: 'http://google.com/hola', path: '/foo/bar/baz.js', expected: 'http://google.com/foo/bar/baz.js' },
    { base: 'http://google.com/hola', path: 'foo/bar/baz.js', expected: 'http://google.com/hola/foo/bar/baz.js' },
    { base: 'https://google.com/hola.html', path: 'foo/bar/baz.js', expected: 'https://google.com/foo/bar/baz.js' },
    { base: 'google.com', path: 'foo/bar/baz.js', expected: 'http://google.com/foo/bar/baz.js' },
    { base: 'https://google.com', path: '//foo/bar/baz.js', expected: 'https://foo/bar/baz.js' },
    { base: 'http://google.com', path: '//foo/bar/baz.js', expected: 'http://foo/bar/baz.js' }

], i, length, example;

for ( i = 0, length = cases.length; i < length; i += 1 ) {

    example = cases[ i ];

    assert.equal( absolutePath( example.path, example.base ), example.expected, 'case i: ' + i + ' | ' + absolutePath( example.path, example.base ) );

}





