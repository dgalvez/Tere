/*
 * (\ /)
 * (O.o)
 * (> <) Tere - simple Javascript Test Driven Development
 *
 *  Copyright (c) 2013 Daniel Gálvez, daniel.galvez.valenzuela@gmail.com
 *
 *  Permission is hereby granted, free of charge, to any
 *  person obtaining a copy of this software and associated
 *  documentation files (the "Software"), to deal in the
 *  Software without restriction, including without limitation
 *  the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the
 *  Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice
 *  shall be included in all copies or substantial portions of
 *  the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
 *  KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 *  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 *  PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 *  OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 *  OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 *  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function( global ) {

    /*
     * Imports
     * TODO: Pull request to node-http-proxy
     */
    var optimist          = require( 'optimist' ),
    	http		  = require( 'http' ),
	request		  = require( 'request' ),
	url		  = require( 'url' ),
	socketIO	  = require( 'socket.io' ),
	watch	          = require( 'watch' ),
	fs	          = require( 'fs' ),
	readline	  = require( 'readline' ),

	httpProxy	  = require( './node-http-proxy/lib/node-http-proxy' ),
	out		  = require( './src/out/pretty' ),
	emitterInjection  = require( './src/browser/emitter' )(),
	findTestFramework = require( './src/findTestFramework' ),
	getScripts	  = require( './src/getScripts' );

    /*
     * Constants
     */
    const rhtml = /<head([^>])*>/,

	  MESSAGE = {
	      USAGE: 'Usage: node tere.js -u [ url ] -d [ path to folder ] -f [ RegExp ]',
	      FRAMEWORK_NOT_FOUND: 'Test framework not found',
	      URL_NOT_REACHABLE: '%s -- Url not reachable',
	      URL_INVALID_FORMAT: '%s -- Invalid url format',
	      FOLDER_NOT_THERE: '%s -- Folder does not exist',
	      FILTER_INVALID: '%s -- Invalid RegExp filter for files to be watched'
	  };

    /*
     * Tools
     */
    var exit = function( message, input ) {

	console.log( MESSAGE.USAGE + '\n' + out.f( message, 'failed' ), input || '' );
	process.exit( 1 );

    };

    /*
     * User input and its validation
     */
    var argv = optimist
		  .usage( MESSAGE.USAGE )
		  .demand( [ 'u' ] )
		  .argv,

	inUrl,
	watchFolder = argv.d || process.cwd(),
	filter = argv.f || '.*\\.js$',

	runningMessage;

    if ( ! /^https?:\/\/.+/i.test( argv.u ) ) {
	exit( MESSAGE.URL_INVALID_FORMAT, argv.u );
    }

    if ( watchFolder && ! fs.existsSync( watchFolder ) ) {
	exit( MESSAGE.FOLDER_NOT_THERE, watchFolder );
    }

    try	       { filter = new RegExp( filter, 'i' ); }
    catch( e ) { exit( MESSAGE.FILTER_INVALID, filter ); }

    /*
     * At this point it seems user input is ok
     */
    inUrl = url.parse( argv.u );

    /*
     * runningMessage show the current context to the user
     */
    runningMessage = 'Running on: ' +

		     out.f(

			 inUrl.protocol +
			 '//' +
			 inUrl.host +
			 ':8001' +
			 inUrl.path

			 , 'passed'

		     ) +

		     '\n' +
		     'Watching files in ' + out.f( watchFolder, 'dt' ) +
		     '\n' +
		     'Matching this RegExp ' + out.f( filter, 'dt' );

    /*
     * The main game takes place below
     */
    var proxy = new httpProxy.RoutingProxy(),

	serverCode = function( req, res ) {

	    /*
	     * Proxying every request as it is, except the specified by the user
	     * in the command line where we add our magic
	     */
	    proxy.proxyRequest(req, res, {

		host: inUrl.host,
		port: inUrl.port || 80,
		path: inUrl.path,
		handler: function( chunk ) {
		    /*
		     * Checking for <head> is a poor way of making sure the response body is a html document
		     * TODO: I'll add headers tests: Content-Type etc.
		     */
		    var html = chunk.toString();

		    /*
		     * TODO: This check shouldn't be done here but in node-http-proxy
		     */
		    if ( ! rhtml.test( html ) ) {

			return chunk;

		    }

		    return new Buffer(
			html.replace(
			    RegExp( '(<script[^>]*' + testFrameworkTarget + '[^>]*>[^<]*</script>)', 'im' ),
			    '$1' + emitterInjection
			)
		    );

		}

	    });

	},

	testFrameworkTarget,

	server,

	io;

    request.get( inUrl.href, function( error, response, body ) {

	if ( ! error && response.statusCode === 200 ) {

	    getScripts( body, function( sources ) {

		if ( ! sources || ! sources.length ) {
		    exit( MESSAGE.FRAMEWORK_NOT_FOUND );
		}

		findTestFramework( sources, inUrl.href, function( src ) {

		    if ( ! src ) {
			exit( MESSAGE.FRAMEWORK_NOT_FOUND );
		    }

		    testFrameworkTarget = src;

		    /*
		     * Starting the server
		     */
		    server = http.createServer( serverCode ).listen(8001);

		    /*
		     * io will help us to know when tests are passing or not
		     * TODO: method should be called here
		     */
		    io = socketIO.listen( server );

		    io.set( 'log level', 1 );
		    io.sockets.on('connection', function( socket ) {

			socket.on( 'test:finished', testFinished );
			socket.on( 'suite:started', suiteStarted );
			socket.on( 'suite:finished', suiteFinished );

		    });

		    /*
		     * TODO: method should be called here
		     */

		    watch.watchTree( watchFolder, function ( f, curr, prev ) {

			if ( ! ( typeof f === 'object' && prev === null && curr === null ) &&
			     filter.test( f )
			   ) {

			    io.sockets.emit( 'reload' );

			}

		    });

		    out.clear().print( runningMessage );

		});

	    });

	} else {

	    exit( MESSAGE.URL_NOT_REACHABLE, inUrl.href );

	}

    });

    /*
     * Browser feedback
     */

    var browsers = {},

	styles = {

	    running: {
		0: 'passed',
		1: 'failed'
	    },

	    finished: {
		0: 'great',
		1: 'shit'
	    }

	},

	rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});

    function updateReport() {

	var now = +new Date(),
	    timeFromLastRun,
	    timerDisplayed,

	    browserID,
	    results,

	    report = '';

	for ( browserID in browsers ) {

	    if ( ! report ) {
		report += out.f( '\n\nBrowsers attached:\n', 'strong' );
	    }

	    results = browsers[ browserID ];

	    timeFromLastRun = ! results.time ? 0 : Math.floor( ( now - results.time ) / 1000 );

	    timeDisplayed = results.state === 'finished'
			    ? ( timeFromLastRun < 3 ? 'Just run!' : timeFromLastRun + ' seconds ago' )
			    : out.f( 'running ...', 'failed' );

	    report += out.f( browserID.slice( 0, 25 ), styles[ results.state ][ +!!results.failed ] ) +
		      Array( 26 - browserID.length ).join( ' ' ) +
				  results.passed + out.f( '✓', 'passed' ) +
		      ' '	+ results.failed + out.f( '✗', 'failed' ) +
		      '    → '  + timeDisplayed +
		      '\n';

	}

	out.clear().print(
	    runningMessage +
	    report + '\n'
	);

	if ( ! report ) {
	    return;
	}

	/*
	 * Let user to load same url in all the browsers attached
	 */

	rl.question( 'Reload all browsers with same url as: ', function( browserID ) {

	    var browser = browsers[ browserID ];

	    if ( browser && browser.url ) {

		io.sockets.emit( 'goto', { url: browser.url } );
		out.clear().print( 'Loading ...' );
		return;

	    }

	    updateReport();

	});

    }

    function testFinished( results ) {

	if ( ! results ||
	     ! results.test ||
	     ! results.browser ||
	     ! browsers[ results.browser ] ) {

	    return;

	}

	var test = results.test,
	    currentBrowserReport = browsers[ results.browser ];

	currentBrowserReport[ test.passed ? 'passed' : 'failed' ] += 1;
	currentBrowserReport.state = 'running';

	updateReport();

    }

    function suiteStarted( browser ) {

	var url = browser.url,
	    id = browser.id;

	if ( ! browsers || ! id ) {

	    return;

	}

	browsers[ id ] = {
	    state: 'running',
	    passed: 0,
	    failed: 0,
	    url: url
	};

    }

    function suiteFinished( results ) {

	if ( ! results ||
	     ! results.summary ||
	     ! results.browser ||
	     ! browsers[ results.browser ] ) {

	    return;

	}

	var summary = results.summary;

	browsers[ results.browser ] = {
	    state: 'finished',
	    passed: summary.passed,
	    failed: summary.failed,
	    time: +new Date(),
	    url: results.url
	};

	updateReport();

    }

    setInterval( updateReport, 10000 );

})( this );
