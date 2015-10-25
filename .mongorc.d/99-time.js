
//////////////////////////////////////////////////////////////////////////
//
// Interactive usage:
//     > time db.whatever.blahblah()
//     > time foo(); bar(); baz()
// Same as if "db.whatever.blahblah()" or "foo(); bar(); baz()" were
// executed interactively, except that on completion the elapsed time
// will be printed when the prompt is next displayed.
//
// Script usage:
// time_start();
// foo();
// bar();
// baz();
// time_end();
//
//////////////////////////////////////////////////////////////////////////

// Because this wraps the `prompt` function, it should be loaded last
// (or after anything else that modifies `prompt`).


// Needs work. Mainly, the "Duration" is output *before* the function result,
// which is weird and counter-intuitive.
//
///////////////////////
// Script usage:
// time(function(){
//     foo();
//     bar();
//     baz();
// });
///////////////////////
//
//time = function (fn, args) {
//	var start = Date.now();
//	var result = fn.apply(args);
//	print("Duration: " + (Date.now() - start) + " ms");
//	return result;
//};


__time_start = undefined;
time_start = function() {
	__time_start = Date.now();
};
time = time_start;

time_end = function() {
	if (__time_start) {
		var end = Date.now();
		var diff = end - __time_start;
		print("Duration: " + diff + " ms");
		__time_start = undefined;
	}
};

if (typeof(prompt) != "undefined") {
	__original_prompt = prompt;
}
prompt = function() {
	time_end();
	if (typeof(__original_prompt) == "undefined") {
		return undefined;
	} else if (typeof(__original_prompt) == "string") {
		return __original_prompt;
	} else {
		return __original_prompt();
	}
}

shellHelper.time = function (cmd) {
	time();
	printjson(eval(cmd));
};
