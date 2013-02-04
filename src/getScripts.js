var jsdom = require( 'jsdom' ).jsdom;

module.exports = function( html, callback ) {

    jsdom.env( html, function( errors, window ) {

	var scripts = Array.prototype.slice.apply(
		window.document.getElementsByTagName( 'script' )
	    ),
	    sources = [];

	scripts.forEach(function( script ) {
	    if ( script.src ) sources.push( script.src );
	});

	if ( callback ) callback( sources );

    });

};



