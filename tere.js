/*
 * (\ /)
 * (O.o)
 * (> <) Tere - simple Javascript Test Driven Development
 */

(function( global ) {

    /*
     * Imports
     * TODO: Pull request to node-http-proxy
     */
    var	http		  = require( 'http' ),
	request		  = require( 'request' ),
	url		  = require( 'url' ),
	socketIO	  = require( 'socket.io' ),
	watch	          = require( 'watch' ),
	httpProxy	  = require( './node-http-proxy/lib/node-http-proxy' ),
	out		  = require( './src/out/pretty' ),
	emitterInjection  = require( './src/browser/emitter' )(),
	findTestFramework = require( './src/findTestFramework' ),
	getScripts	  = require( './src/getScripts' );

    /*
     * Constants
     */
    const rhtml = /<head([^>])*>/;

    /*
     * Tools
     */
    var log = function( message ) {

	console.log( message );
	process.exit( 1 );

    };

    /*
     * Input from the user
     * TODO: Validate and probably sanitize user input - format/filter/folder
     */
    var inUrl = url.parse( process.argv[ 2 ] ),

	filter = RegExp( process.argv[ 3 ] || '.*', 'ig' ),
	watchFolder = process.argv[ 4 ] || __dirname,

	runningMessage = 'Running on: ' +
		         inUrl.protocol +
		         '//' +
		         inUrl.host +
			 ':8001' +
			 inUrl.path;

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

		findTestFramework( sources, inUrl.href, function( src ) {

		    if ( ! src ) {

			log( 'Test framework not found' );

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

		    if ( process.argv[ 3 ] ) {

			watch.watchTree( watchFolder, function ( f, curr, prev ) {

			    if ( ! ( typeof f === 'object' && prev === null && curr === null ) &&
				 filter.test( f )
			       ) {

				io.sockets.emit( 'reload' );

			    }

			});

		    }

		    out.clear().print( runningMessage );

		});

	    });

	} else {

	    log( 'Url not reachable' );

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

	};

    function updateReport() {

	var browserID,
	    results,
	    report = '';

	for ( browserID in browsers ) {

	    results = browsers[ browserID ];

	    report += out.f( browserID, styles[ results.state ][ +!!results.failed ] ) +
		      ' Passed: ' + results.passed +
		      ' Failed: ' + results.failed +
		      '\n';

	}

	out.clear().print(
	    out.f( runningMessage, 'h' ) +
	    out.f( '\n\nBrowsers attached:\n', 'strong' ) +
	    report
	);

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

	if ( ! browsers || ! browser.id ) {

	    return;

	}

	browsers[ browser.id ] = {
	    state: 'running',
	    passed: 0,
	    failed: 0
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
	    failed: summary.failed
	};

	updateReport();

    }

})( this );
