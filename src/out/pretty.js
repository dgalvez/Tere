module.exports = {

    styles: {

	b: '\033[37m\033[1m',
	dl: '\033[37m\033[40m\033[1m',
	dt: '\033[40m\033[33m\033[1m',
	h: '\033[33m',
	strong: '\033[1m',
	failed: '\033[31m\033[1m',
	passed: '\033[32m\033[1m',
	shit: '\033[41m\033[37m\033[1m',
	great: '\033[42m\033[37m\033[1m'

    },

    print: function( text ) {

	process.stdout.write( text );

	return this;

    },

    clear: function() {

	process.stdout.write( '\u001B[2J\u001B[0;0f' );

	return this;

    },

    f: function( text, style ) {

	return this.styles[ style ] + text + '\033[0m';

    }

};
