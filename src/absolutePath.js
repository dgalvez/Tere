var url = require( 'url' );

module.exports = function( path, baseUrl ) {

    if ( ! /https?:\/\//.test( baseUrl ) ) { baseUrl = 'http://' + baseUrl; }

    baseUrl = baseUrl.replace( /(.*\/\/.*\/)[^/]*\.[^/]*$/, '$1' );

    if ( baseUrl.slice( -1 ) !== '/' ) { baseUrl += '/'; }

    return url.resolve( baseUrl, path );

};

