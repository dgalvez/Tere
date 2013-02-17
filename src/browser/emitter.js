module.exports = function() {

    var init = function() {

	    var window = (function() { return this; })();

	    window.__tereOldDefine__ = window.define;
	    window.define = function() {};

	},
	method = function() {

	    var socket = io.connect( 'http://localhost:8001' ),
		window = (function() { return this; })(),

		// jQuery 1.8.3 $.browser
	        matched,

		browserID,

		uaMatch = function( ua ) {

		    ua = ua.toLowerCase();

		    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
				/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
				/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
				/(msie) ([\w.]+)/.exec( ua ) ||
				ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
				[];

		    return {
			browser: match[ 1 ] || "",
			version: match[ 2 ] || "0"
		    };

		};

	    matched = uaMatch( navigator.userAgent );
	    browserID = matched.browser + ' v' + matched.version;

	    socket.on( 'reload', function () {
		window.location.reload();
	    });

	    socket.on( 'goto', function ( to ) {
		window.location.href = to.url;
	    });

	    QUnit.begin = function() {

		socket.emit( 'suite:started', { id: browserID, url: window.location.href } );

	    };

	    QUnit.done = function( summary ) {

		socket.emit( 'suite:finished', {
		    summary: summary,
		    browser: browserID,
		    url: window.location.href
		});

	    };

	    QUnit.log = function( test ) {

		socket.emit( 'test:finished', {
		    test: { name: test.name, passed: test.result },
		    browser: browserID
		});

	    };

	    window.define = window.__tereOldDefine__;

	};

    return '<script>(' +
	       init.toString() +
	   ')();</script><script src="/socket.io/socket.io.js"></script><script>(' +
	       method.toString() +
	   ')();</script>';

};

