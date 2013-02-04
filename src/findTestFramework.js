var absolutePath = require( './absolutePath' ),
    checkGlobal = require( './checkGlobal' ),
    request = require( 'request' );

module.exports = function( sources, href, callback ) {

    var src,
	originalSrc,
	checked = 0,
	found = false,
	i, length;

    for ( i = 0, length = sources.length; i < length; i += 1 ) {

	if ( found ) return;

	originalSrc = sources[ i ];
	src = absolutePath( originalSrc, href );

	(function( src, originalSrc ) {

	    request.get( src, function( error, response, body ) {

		if ( ! error && response.statusCode === 200 ) {

		    if ( checkGlobal( body, 'QUnit' ) ) {

			found = true;

			callback( originalSrc );

		    }

		}

		checked += 1;

		if ( checked === length && ! found ) {

		    callback( false );

		}

	    });

	})( src, originalSrc );

    }

};
