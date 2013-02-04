var vm = require( 'vm' ),
    jsdom = require( 'jsdom' ).jsdom;

module.exports = function( scriptContents, name ) {

    var f = function() {
	    this.window = this;
	},
	script = vm.createScript( '(' + f.toString() + ')();' + scriptContents ),
	doc = jsdom( '<html><head></head><body></body></html>' ),
	global = doc.createWindow();

    try { script.runInNewContext( global ); } catch ( e ) {}

    return name in global && global[ name ];

};

