
// Function to generate a string of a given length.


// genstr(102400)
//  - return a 100kb string (full of 'x' chars)
//
// genstr(102400, '_')
//  - return a 100kb string (full of '_' chars)
//
// genstr(102400, 'ab')
//  - return a 200kb string ("ababababab...")


genstr = function (len, chr) {
	assert.eq(typeof(len), "number");
	assert.gte(len, 0);
	len = Math.floor(len);
	if ( ! (typeof(chr) == "string" && chr.length == 1) ) {
		chr = "x";
	}
	return (new Array(len+1)).join(chr);
};

