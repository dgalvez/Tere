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
    var optimist          = require( 'optimist' ),
    	http		  = require( 'http' ),
	request		  = require( 'request' ),
	url		  = require( 'url' ),
	socketIO	  = require( 'socket.io' ),
	watch	          = require( 'watch' ),
	fs	          = require( 'fs' ),

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
	watchFolder = argv.d || __dirname,
	filter = argv.f || '.*\\.js',

	runningMessage;

    if ( ! /^https?:\/\/.+/i.test( argv.u ) ) {
	exit( MESSAGE.URL_INVALID_FORMAT, argv.u );
    }

    if ( watchFolder && ! fs.existsSync( watchFolder ) ) {
	exit( MESSAGE.FOLDER_NOT_THERE, watchFolder );
    }

    try	       { filter = new RegExp( filter, 'ig' ); }
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
	    runningMessage +
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
