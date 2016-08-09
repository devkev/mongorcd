
/////////////////
// MAIN ENTRY POINT
/////////////////

// Converts things to "MongoDB Extended JSON" format.
// Mostly follows the official spec:
//     https://docs.mongodb.org/manual/reference/mongodb-extended-json/
// But has lots of further enhancements and goodies.
//
// Main interface:
//
//     xJSON.stringify(thing, options)
//
// `options` is an object that specifies how to print the thing.
// If omitted, default values will be used.  Unknown options are ignored.
// The most important option is `mode`, which specifies whether to output
// in "Shell mode" or "Strict mode" Extended JSON format.
// See further below for more details on options.
//
// Alternate/convenience interfaces:
//
//     // Generic alternatives:
//     toExtendedJSON(thing, options)
//     toxjson(thing, options)
//     toxjsononeline(thing, options)       // same as toxjson, but output a single line
//
//     // Shortcuts for Shell Mode conversion:
//     xJSON.shell.stringify(thing, options)
//     toExtendedJSON.shell(thing, options)
//     toxjson.shell(thing, options)
//
//     // Shortcuts for Strict Mode conversion:
//     xJSON.strict.stringify(thing, options)
//     toExtendedJSON.strict(thing, options)
//     toxjson.strict(thing, options)
//
//     // If foobar is a supported type, and is not `undefined` or `null`:
//     foobar.toExtendedJSON(options)
//
//     // Print the result:
//     printxjson(thing, options)
//     printxjsononeline(thing, options)    // same as printxjson, but output a single line
//
// Generally, the defaults are tailored towards human-readability (sometimes at
// the expense of the spec), while preserving parsability and type fidelity.
//
// For strict adherence to the spec (at the expense of readability), use
//     { pedantic: true }
//
// For ultimate human readability (at the expense of the spec, parsability, and
// sometimes information), use
//     { human: true }
//
// Valid options:
//
//     mode: <string>         // Either "shell" (default) or "strict" to choose which style of MongoDB Extended JSON to output.
//     pedantic: <boolean>    // Default: false.  If true, adjust the options below to always adhere completely to the spec no matter what.  Otherwise, if false (default), the options below are not adjusted.
//     human: <boolean>       // Default: false.  If true, adjust the options below to optimise for readability, even if the output is no longer valid/parsable, or doesn't preserve type fidelity.  Otherwise, if false (default), the options below are not adjusted.
//
//     oneLine: <boolean>     // Default: false.  If true, output objects and arrays on a single line.  Otherwise, if false (default), output objects and arrays on multiple lines.
//     indentStr: <string>    // Default: "\t".  Specifies the string to use for each level of indentation (when oneLine is false).
//
//     quoteAllFieldNames: <boolean>      // Default: false for "shell" mode, true for "strict" mode.  If true (default for "strict" mode), object field names that don't need to be quoted (ie. which are a valid javascript identifier name), enclose them in double quotes anyway.  Otherwise, if false (default for "shell" mode), field names will not be enclosed in double quotes unless necessary.  (Note that explicitly specifying false in "strict" mode gives invalid output (ie. output which may not strictly conform to the JSON specification.)
//     emptyObjectsOneLine: <boolean>     // Default: true.  If true (default), output empty objects as "{ }", even if oneLine is false.  Otherwise, if false, the opening and closing braces will be on separate lines.
//     emptyArraysOneLine: <boolean>      // Default: true.  As emptyObjectsOneLine, but for arrays.
//     collapseShortObjects: <boolean>    // Default: true.  If true (default), objects which are < 80 characters will be "collapsed" onto a single line, even if oneLine is false.  Otherwise, if false, short objects will always be multiline when oneLine is false.
//     collapseShortArrays: <boolean>     // Default: true.  As collapseShortObjects, but for arrays.
//     preferISODate: <boolean>           // Default: true.  If true (default), use `ISODate()` (which is more backward compatible, and more readable) for Date objects in "shell" mode.  Otherwise, if false, use `new Date()` for Date objects in "shell" mode.
//     includeEpochDate: <boolean>        // Default: true.  Date objects usually have an ISO-formatted date string.  If true (default), Date objects will also include the millis since epoch (in such a way that it is ignored by (normal) parsers).  Otherwise, if false, the millis since epoch will not also be included.  (If the output would normally use the millis since epoch rather that the ISO-formatted date string, then this option triggers the inclusion of the ISO-formatted date string (in addition to the millis since epoch), where that is possible.)
//     preferHexData: <boolean>           // Default: false.  If true, a hexadecimal encoding will be used for binary (BinData) objects (this uses `HexData()` in "shell" mode, and a "$hex" sub-object field in "strict" mode).  Otherwise, if false (default), the normal base64 encoding will be used instead (`BinData()` in "shell" mode, and a string in "strict" mode).
//     truncateBinData: <int>             // Default: 0, which means unlimited.  The maximum number of bytes of BinData to consider when converting to either base64 or hex.
//     truncateString: <int>              // Default: 0, which means unlimited.  The maximum number of chars of strings to include in output (not including the trailing '...').
//     preferNumberIntConversion: <boolean>    // Default: false.  If true, convert NumberInt objects to normal numbers.  This improves readability significantly, and does not cause a loss of precision, but it can cause type fidelity problems.  Otherwise, if false (default), NumberInt objects are not converted to numbers.
//     preferNumberIntAsString: <boolean>      // Default: false.  If true, NumberInt objects use a string representation (for consistency with NumberLongs), even though normal numbers have sufficient precision.  Otherwise, if false (default), a number-based representation is used (as per the spec).
//     preferExperimentalAlternateBinDataStrictFormat: <boolean>    // Default: false.  If true, BinData objects in "strict" mode will use `{ "$binary" : { "$base64" : "base64string" }, "$type" : t }`, for consistency with the preferHexData format.  Otherwise, if false (default), the normal representation will be used, ie. `{ "$binary" : "base64string", "$type" : t }`.
//

// FIXME: optionally colorize output (steal from mongo-hacker).
// Ideally, unless forced, only output color if stdout is a tty and $TERM is appropriate (how does mongo-hacker handle this? not terribly well).

// options includes mode and things like oneLine, indent level, and otherwise how pretty to make the output, eg. colouring, etc
// mode defaults to _extendedJson, or if that's not set, "shell"

// FIXME: This should go into an ExtendedJSON object, ala JSON.stringify().
// This will allow ExtendedJSON.parse() (ala JSON.parse()) in the future.
// Then "toExtendedJSON" (and its friends like toxjson()) can just be helper shortcuts to ExtendedJSON.stringify().
// Since "ExtendedJSON" is a mouth/finger-ful, have "xJSON" as an alias.
// This will also allow using xJSON.ShellMode and xJSON.StrictMode as pseudo-enums for the mode option.
// It'll also be somewhere better for the various private functions and variables.

var xJSON = {};


// Pseudo-enum of valid modes.
xJSON.mode = {
	// Symbols are normally better for this, but make life needlessly hard in this case
	shell : "shell",
	strict : "strict"
};


// The default mode.
xJSON.defaultMode = xJSON.mode.shell;


xJSON.stringify = function (thing, options) {
	if (typeof thing === "undefined") {
		return xJSON._undefined(options);
	}

	if (thing === null) {
		return xJSON._null(options);
	}

	if (typeof thing.toExtendedJSON === "function") {
		return thing.toExtendedJSON(options);
	}

	throw "xJSON.stringify() can't handle type " + (typeof x);
};


// For the future, xJSON.parse().



/////////////////
// undefined
/////////////////

// This can't be "inside" the `undefined` object, so it's here instead.
xJSON._undefined = function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "undefined";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$undefined" : true }, Object.merge(options, { oneLine: true }) );
		}
	});
};



/////////////////
// null
/////////////////

// This can't be "inside" `null`, so it's here instead.
xJSON._null = function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			return "null";
		}
	});
};



/////////////////
// Object
/////////////////

//Object.prototype.toExtendedJSON = function (options, mode) {
Object.defineProperty(Object.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			// FIXME: This is SOOOOOO similar to Array - consolidate them (DRY).
			var lineEnd = _defaultFalse(options.oneLine) ? " " : "\n";
			var indent = _defaultFalse(options.oneLine) ? "" : options.indentStr;
			// FIXME: ability to specify a different baseIndentStr (eg. you want to indent by 2 spaces each level, but start at 13 spaces (eg. SERVER-19076)).
			var baseIndentStr = _defaultFalse(options.oneLine) ? "" : (new Array(options.indentLevel + 1)).join(indent);

			// support _simplekeys() for the crazy objects that have it (currently only MapReduceResult).
			var keys = this;
			if (typeof(this._simpleKeys) === "function") {
				keys = this._simpleKeys();
			}


			var fieldStrs = [];
			options.indentLevel++;
			for (var field in keys) {
				if (this.hasOwnProperty(field)) {
					// Optionally omit quotes around field names (where possible)
					var quote = (_defaultFalse(options.quoteAllFieldNames) || xJSON._fieldNameRequiresQuoting(field)) ? '"' : "";
					fieldStrs.push(baseIndentStr + indent + quote + field + quote + " : " + xJSON.stringify(this[field], options));
				}
			}
			options.indentLevel--;

			// Empty objects are shown on one line (ie. "{ }"), unless options includes { emptyObjectsOneLine: false }
			if (fieldStrs.length == 0 && _defaultTrue(options.emptyObjectsOneLine)) {
				lineEnd = " ";
				indent = "";
				baseIndentStr = "";
			}

			var s = "{" + lineEnd;
			if (fieldStrs.length > 0) {
				s += fieldStrs.join("," + lineEnd) + lineEnd;
			}
			s += baseIndentStr + "}";

			// If oneLine === false and indentLevel == 0, but the string length < 80, then convert to oneLine.
			// Disable this behaviour by setting the option { collapseShortObjects: false }
			// FIXME: customisable threshold
			if (_defaultTrue(options.collapseShortObjects)) {
				if ( ! options.oneLine && s.length < 80 && (options.noIndentStrWasSpecified && options.indentLevel === 0) ) {
					s = s.replace(/[\t\r\n]+/gm, " ");
				}
			}

			return s;
		}
	});
} } );

// Tab completion for Object is a bit weird.
// FIXME: monkeypatch any pre-existing Object.autocomplete function
Object.defineProperty(Object, "autocomplete", { enumerable: false, configurable: true, value: function () {
	return [ "toExtendedJSON" ];
} } );
// FIXME: monkeypatch any pre-existing Object.prototype.autocomplete function
Object.defineProperty(Object.prototype, "autocomplete", { enumerable: false, configurable: true, value: function () {
	return [ "toExtendedJSON" ];
} } );



/////////////////
// Array
/////////////////

Object.defineProperty(Array.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			// FIXME: option to truncate long values...

			var lineEnd = _defaultFalse(options.oneLine) ? " " : "\n";
			var indent = _defaultFalse(options.oneLine) ? "" : options.indentStr;
			// FIXME: ability to specify a different baseIndentStr (eg. you want to indent by 2 spaces each level, but start at 13 spaces (eg. SERVER-19076)).
			var baseIndentStr = _defaultFalse(options.oneLine) ? "" : (new Array(options.indentLevel + 1)).join(indent);

			var fieldStrs = [];
			options.indentLevel++;
			for (var field in this) {
				if (this.hasOwnProperty(field)) {
					fieldStrs.push(baseIndentStr + indent + xJSON.stringify(this[field], options));
				}
			}
			options.indentLevel--;

			// Empty arrays are shown on one line (ie. "[ ]"), unless options includes { emptyArraysOneLine: false }
			if (fieldStrs.length == 0 && _defaultTrue(options.emptyArraysOneLine)) {
				lineEnd = " ";
				indent = "";
				baseIndentStr = "";
			}

			var s = "[" + lineEnd;
			if (fieldStrs.length > 0) {
				s += fieldStrs.join("," + lineEnd) + lineEnd;
			}
			s += baseIndentStr + "]";

			// If oneLine === false and indentLevel == 0, but the string length < 80, then convert to oneLine.
			// Disable this behaviour by setting the option { collapseShortArrays: false }
			// FIXME: customisable threshold
			if (_defaultTrue(options.collapseShortArrays)) {
				if ( ! options.oneLine && s.length < 80 && (options.noIndentStrWasSpecified && options.indentLevel === 0) ) {
					s = s.replace(/[\t\r\n]+/gm, " ");
				}
			}

			return s;
		}
	});
} } );



/////////////////
// Number
/////////////////

Object.defineProperty(Number.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			return this.toString();
		}
	});
} } );



/////////////////
// String
/////////////////

Object.defineProperty(String.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			var str = this;
			if (typeof options.truncateString == "number" && options.truncateString > 0 && this.length > options.truncateString) {
				str = str.substring(0, options.truncateString) + "...";
			}
			return str.toQuotedString();
		}
	});
} } );



/////////////////
// Boolean
/////////////////

Object.defineProperty(Boolean.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			return this.toString();
		}
	});
} } );



/////////////////
// Function
/////////////////

Object.defineProperty(Function.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return this.toString();
		},
		"strict" : function (options) {
			// I just made this up, because the spec doesn't mention it.
			// https://jira.mongodb.org/browse/DOCS-6886
			return xJSON.stringify( { "$function" : this.toString() }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// NumberLong
/////////////////

Object.defineProperty(NumberLong.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "NumberLong(\"" + this.toExactValue() + "\")";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$numberLong" : this.toExactValue() }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// NumberInt
/////////////////

Object.defineProperty(NumberInt.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	// Watch out for:
	//   https://jira.mongodb.org/browse/SERVER-5234
	//   https://jira.mongodb.org/browse/SERVER-5424
	//   https://jira.mongodb.org/browse/SERVER-11957
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			// If desired (eg. human consumable output), convert NumberInt to a number (since all 32 bit ints can be represented by Javascript's 64 bit float number type).
			// This will help a lot with SERVER-5424 and similar.
			if (_defaultFalse(options.preferNumberIntConversion)) {
				return xJSON.stringify(this.toNumber(), options);
			} else {
				// Optionally choose to always output this as a string (to be consistent with NumberLong)
				var num = this.toNumber();
				if (_defaultFalse(options.preferNumberIntAsString)) {
					num = num.toString();
				}
				return "NumberInt(" + xJSON.stringify(num, options) + ")";
			}
		},
		"strict" : function (options) {
			// If desired (eg. human consumable output), convert NumberInt to a number (since all 32 bit ints can be represented by Javascript's 64 bit float number type).
			// This will help a lot with SERVER-5424 and similar.
			if (_defaultFalse(options.preferNumberIntConversion)) {
				return xJSON.stringify(this.toNumber(), options);
			} else {
				// I just made this up, because the spec doesn't mention it.
				// https://jira.mongodb.org/browse/DOCS-6886
				// Optionally choose to always output this as a string (to be consistent with NumberLong)
				var num = this.toNumber();
				if (_defaultFalse(options.preferNumberIntAsString)) {
					num = num.toString();
				}
				// FIXME: ideally, pedantic mode should prevent these things from being on oneLine
				return xJSON.stringify( { "$numberInt" : num }, Object.merge(options, { oneLine: true }) );
			}
		}
	});
} } );



/////////////////
// MinKey
/////////////////

Object.defineProperty(MinKey, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "MinKey";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$minKey" : 1 }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// MaxKey
/////////////////

Object.defineProperty(MaxKey, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "MaxKey";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$maxKey" : 1 }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// DBRef
/////////////////

// This corresponds to BSON type 0x03 - an object with these special fields.
// It does *not* correspond to BSON type 0x0c.
Object.defineProperty(DBRef.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "DBRef(" + xJSON.stringify(this.$ref, options) + ", " + xJSON.stringify(this.$id, options) + (this.$db ? ", " + xJSON.stringify(this.$db, options) : "") + ")";
		},
		"strict" : function (options) {
			return xJSON.stringify( Object.extend( { "$ref" : this.$ref, "$id" : this.$id }, (this.$db ? { "$db" : this.$db } : {}) ), Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// DBPointer
/////////////////

// Somewhat surprisingly, this is BSON type 0x0c (which is deprecated).
// It's not defined by the Extended JSON spec, but mongoexport guides us (although 3.2 (new tools) behaves differently to 2.6 (old tools)).
Object.defineProperty(DBPointer.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "DBPointer(" + xJSON.stringify(this.ns, options) + ", " + xJSON.stringify(this.id, options) + ")";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$ref" : this.ns, "$id" : this.id }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// ObjectId
/////////////////

Object.defineProperty(ObjectId.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "ObjectId(\"" + this.str + "\")";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$oid" : this.str }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// Date
/////////////////

Object.defineProperty(Date.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	// Stolen from Date.tojson()
	// FIXME: optionally be capable of using the Date's native timezone, or converting to an arbitrary tz
	var UTC = 'UTC';
	var year = this['get'+UTC+'FullYear']().zeroPad(4);
	var month = (this['get'+UTC+'Month']() + 1).zeroPad(2);
	var date = this['get'+UTC+'Date']().zeroPad(2);
	var hour = this['get'+UTC+'Hours']().zeroPad(2);
	var minute = this['get'+UTC+'Minutes']().zeroPad(2);
	var sec = this['get'+UTC+'Seconds']().zeroPad(2)

	if (this['get'+UTC+'Milliseconds']())
		sec += '.' + this['get'+UTC+'Milliseconds']().zeroPad(3)

	var ofs = 'Z';
	// // print a non-UTC time
	// var ofsmin = this.getTimezoneOffset();
	// if (ofsmin != 0){
	//     ofs = ofsmin > 0 ? '-' : '+'; // This is correct
	//     ofs += (ofsmin/60).zeroPad(2)
	//     ofs += (ofsmin%60).zeroPad(2)
	// }
	var isoDateStr = '' + year+'-'+month+'-'+date+'T'+hour+':'+minute+':'+sec+ofs;
	var epochDate = this.getTime();
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			var extra = "";
			if (_defaultTrue(options.preferISODate)) {
				// The spec says `new Date(NumberLong(millis_since_epoch))`, not `ISODate("...")`.
				// But ISODate is what it should be.
				// https://jira.mongodb.org/browse/DOCS-6992
				if (_defaultTrue(options.includeEpochDate)) {
					// an extra parameter (ignored by ISODate, but not by Date's constructor), which is the epoch time
					extra = ", " + epochDate;
				}
				return 'ISODate("'+isoDateStr+'"' + extra + ')';
			} else {
				// The Date constructor gets cranky if I try to sneak the isoDate in as an extra parameter, because
				// there is a legitimate constructor which takes two args (and they aren't millis since epoch and isoDate).
				// The only ways I can think of to get it in are disgusting things like the ternary operator.
				// Easier for this to be the one case which is incapable of also showing a human readable form, and
				// relying on pedantic: false meaning that the readable IsoDate form above will normally be used.
				return 'new Date('+epochDate+')';
			}
		},
		"strict" : function (options) {
			// includeEpochDate is an option (default true) which controls and
			// an extra field (which according to JSON philosophy should be
			// ignored by anything that doesn't specifically go looking for
			// it), which is the epoch time
			var extra = {};
			if (epochDate >= 0) {
				if (_defaultTrue(options.includeEpochDate)) {
					Object.extend(extra, { "$epochDate" : NumberLong(epochDate) } );
				}
				return xJSON.stringify( Object.extend( { "$date" : isoDateStr }, extra), Object.merge(options, { oneLine: true }) );
			} else {
				// Negative dates must use an alternate format.
				// So too must "dates past what your system's time_t type can hold",
				// but since Javascript epochs are < 64 bit int (because 64 bit float),
				// they are smaller than the range for time_t (32 bit systems are deprecated).
				// So there is no need to worry about this part.
				if (_defaultTrue(options.includeEpochDate)) {
					// Here 'includeEpochDate' actually means 'includeIsoDate', since negative dates are "the other way around".
					Object.extend(extra, { "$isoDate" : isoDateStr } );
				}
				return xJSON.stringify( Object.extend( { "$date" : NumberLong(epochDate) }, extra), Object.merge(options, { oneLine: true }) );
			}
		}
	});
} } );



/////////////////
// Timestamp
/////////////////

Object.defineProperty(Timestamp.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return "Timestamp(" + this.t + ", " + this.i + ")";
		},
		"strict" : function (options) {
			return xJSON.stringify( { "$timestamp" : { t: this.t, i: this.i } }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// BinData
/////////////////

Object.defineProperty(BinData.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	var needsTruncation = function (options, self) {
		return (typeof options.truncateBinData == "number" && options.truncateBinData > 0 && self.length() > options.truncateBinData);
	};
	return xJSON._dispatch(this, options, {

		// Truncating hex is easy (just take an even number of bytes from the string), but truncating base64 is a pain (can't do it naively).
		// Ideally, the hex() and base64() functions should take an int which is the max number of bytes of raw data to convert.
		// The workaround for this is to get the hex, truncate it, and if we need base64, then create a new variable with HexData and then call base64() on it.
		// This workaround will be pretty slow for very large bindatas.

		// Still need to figure out a way to indicate (in shell mode) that the bindata has been truncated - can't just add "..." to the end of the string,
		// since then it won't be valid hexdata or base64.  BinData and HexData are picky and refuse to run with extra parameters.
		// About the only thing I can think of is using "" for normal data, and '' for truncated data.  Which is pretty awful.
		// Strict mode is easy, just add "$truncated" : true, "$truncatedLength" : N, "$originalLength" : M.

		"shell" : function (options) {
			if (_defaultFalse(options.preferHexData)) {
				var str = this.hex();
				var quote = "\"";
				if (needsTruncation(options, this)) {
					str = str.substring(0, 2 * options.truncateBinData);
					quote = "'";
				}
				return "HexData(" + this.subtype() + ", " + quote + str + quote + ")";
			} else {
				var str = this.base64();
				var quote = "\"";
				if (needsTruncation(options, this)) {
					str = HexData(this.subtype(), this.hex().substring(0, 2 * options.truncateBinData)).base64();
					quote = "'";
				}
				return "BinData(" + this.subtype() + ", " + quote + str + quote + ")";
			}
		},
		"strict" : function (options) {
			if (_defaultFalse(options.preferHexData)) {
				// There is no hex version for this in the spec. :(
				// See also https://jira.mongodb.org/browse/DOCS-5243
				// This is the format I cooked up.
				// It's pretty stupid, but does the job in a backward compatible way.
				var obj = { "$binary" : { "$hex" : this.hex() }, "$type" : this.subtype().toString(16) };
				if (needsTruncation(options, this)) {
					obj["$binary"]["$hex"] = obj["$binary"]["$hex"].substring(0, 2 * options.truncateBinData);
					obj["$truncated"] = true;
					obj["$truncatedLength"] = options.truncateBinData;
					obj["$originalLength"] = this.length();
				}
				return xJSON.stringify( obj, options );
			} else {
				// Oh how this should have been a sub-object with "$base64".
				// Optionally choose to do it this way anyway.
				var str = this.base64();
				var typestr = this.subtype().toString(16);
				var extras = {};
				if (needsTruncation(options, this)) {
					str = HexData(this.subtype(), this.hex().substring(0, 2 * options.truncateBinData)).base64();
					extras["$truncated"] = true;
					extras["$truncatedLength"] = options.truncateBinData;
					extras["$originalLength"] = this.length();
				}
				if (_defaultFalse(options.preferExperimentalAlternateBinDataStrictFormat)) {
					return xJSON.stringify( Object.extend({ "$binary" : { "$base64" : str }, "$type" : typestr }, extras), options );
				} else {
					return xJSON.stringify( Object.extend({ "$binary" : str, "$type" : typestr }, extras), options );
				}
			}
		}
	});
} } );



/////////////////
// RegExp
/////////////////

Object.defineProperty(RegExp.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
			return this.toString();
		},
		"strict" : function (options) {
			// "sticky" is debatable, it's marked as being experimental in SpiderMonkey.
			return xJSON.stringify( { "$regex" : this.source, "$options" : (this.global ? "g" : "") + (this.ignoreCase ? "i" : "") + (this.multiline ? "m" : "") + (this.sticky ? "y" : "") }, Object.merge(options, { oneLine: true }) );
		}
	});
} } );



/////////////////
// Code
/////////////////

Object.defineProperty(Code.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"shell" : function (options) {
            if (this.scope === undefined) {
			    return "Code(\"" + this.code + "\")";
            } else {
			    return "Code(\"" + this.code + "\", " + xJSON.stringify(this.scope) + ")";
            }
		},
		"strict" : function (options) {
            if (this.scope === undefined) {
			    return xJSON.stringify( { "$code" : this.code }, Object.merge(options, { oneLine: true }) );
            } else {
			    return xJSON.stringify( { "$code" : this.code, "$scope" : this.scope }, Object.merge(options, { oneLine: true }) );
            }
		}
	});
} } );



// FIXME: Error.toExtendedJSON (not part of BSON, but still useful)

// FIXME: Function

// FIXME: define a MapReduceResult.toExtendedJSON, so as to handle it properly (rather than relying on _simpleKeys())

// FIXME: search for other types that implement .tojson()
// eg. DB, DBCollection

// NumberDecimal

// WriteConcern
// ReadConcern?



/////////////////
// DB
/////////////////

Object.defineProperty(DB.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			return this.getName();
		}
	});
} } );



/////////////////
// DBCollection
/////////////////

Object.defineProperty(DBCollection.prototype, "toExtendedJSON", { enumerable: false, configurable: true, value: function (options) {
	return xJSON._dispatch(this, options, {
		"*" : function (options) {
			return this.getFullName();
		}
	});
} } );





/////////////////
// Internals
/////////////////


var toExtendedJSON = xJSON.stringify;


// Convenience functions.
var toxjson = toExtendedJSON;

var toxjsononeline = function (thing, options) {
	if (typeof options !== "object") options = {};
	return xJSON.stringify(thing, Object.merge(options, { oneLine: true }));
};

// Should these be consistent with print(), which prints all its arguments,
// or printjson(), which prints only the first?
// If the former, how to pass in options?
var printxjson = function (thing, options) {
	print(toxjson(thing, options));
};

var printxjsononeline = function (thing, options) {
	print(toxjsononeline(thing, options));
};


// FIXME: loop
// for (mode in xJSON.mode) print(mode, String(xJSON.mode[mode]))
xJSON.shell = {
	stringify: function (thing, options) {
		return xJSON.stringify(thing, Object.merge(options, { mode: xJSON.mode.shell } ) );
	}
};
// For convenience.
//JSON.shell = xJSON.shell;
toExtendedJSON.shell = xJSON.shell.stringify;

xJSON.strict = {
	stringify: function (thing, options) {
		return xJSON.stringify(thing, Object.merge(options, { mode: xJSON.mode.strict } ) );
	}
};
//JSON.strict = xJSON.strict;
toExtendedJSON.strict = xJSON.strict.stringify;



xJSON._validateOptions = function (options) {
	if (typeof options === "undefined") {
		options = {};
	} else {
		assert(typeof options === "object", "options must be an object");
		// Since we may modify options below, we need to clone it, to avoid (rudely) mangling the user's object.
		options = Object.extend({}, options, true);
	}
	if (typeof options.mode === "undefined") {
		if (typeof _extendedJSONMode === "undefined") {
			_extendedJSONMode = xJSON.defaultMode;
		}
		options.mode = _extendedJSONMode;
	}
	assert(typeof options.mode === "string", "extended JSON mode must be a string, not " + typeof options.mode);
	// Check it's a valid mode
	assert(options.mode in xJSON.mode, "invalid mode: " + options.mode);

	if (typeof options.indentLevel !== "number") {
		options.indentLevel = 0;
	}
	if (typeof options.indentStr !== "string") {
		options.indentStr = "\t";
		options.noIndentStrWasSpecified = true;
	}

	// human: false (default) leaves all options at their default values, ie. some usability tweaks/conveniences are not enabled (though some are).
	// human: true is a shortcut to enable various usability tweaks/conveniences, to optimise the output for human consumption.
	// The resulting output might not adhere to the spec, and *might not parse*.
	if (_defaultFalse(options.human)) {
		options.quoteAllFieldNames = false;
		options.emptyObjectsOneLine = true;
		options.emptyArraysOneLine = true;
		options.collapseShortObjects = true;
		options.collapseShortArrays = true;
		options.preferISODate = true;
		options.includeEpochDate = true;
		options.preferHexData = false;
		options.preferExperimentalAlternateBinDataStrictFormat = false;
		options.truncateBinData = 64;
		options.truncateString = 64;
		options.preferNumberIntConversion = true;
		options.preferNumberIntAsString = false;
	}

	// pedantic: false (default) leaves all options at their default values, ie. some usability tweaks/conveniences are enabled (but some aren't).
	// pedantic: true is a shortcut to disable all the usability tweaks/conveniences.  The letter of the spec will be adhered to (no matter how stupid or ugly), and no more.
	// (tweaks/conveniences which are disabled by default must be individually enabled.)
	if (_defaultFalse(options.pedantic)) {
		options.quoteAllFieldNames = true;
		options.emptyObjectsOneLine = false;
		options.emptyArraysOneLine = false;
		options.collapseShortObjects = false;
		options.collapseShortArrays = false;
		options.preferISODate = false;
		options.includeEpochDate = false;
		options.preferHexData = false;
		options.preferExperimentalAlternateBinDataStrictFormat = false;
		options.truncateBinData = 0;
		options.truncateString = 0;
		options.preferNumberIntConversion = false;
		options.preferNumberIntAsString = true;
	}

	if (typeof options.quoteAllFieldNames === "undefined") {
		options.quoteAllFieldNames = {
			shell: false,
			strict: true
		}[options.mode];
	}

	// Other fields aren't essential, so their presence or absence can be handled on a case-by-case basis where they are needed.

	return options;
};


xJSON._dispatch = function (_this, options, converters) {
	options = xJSON._validateOptions(options);
	assert.eq(typeof converters, "object");
	var result;
	if (typeof converters["*"] === "function") {
		assert.eq(Object.keys(converters), [ "*" ], "when using the \"*\" extended JSON converter, no other converters may be present");
		result = converters["*"].call(_this, options);
	} else {
		assert.eq(Object.keys(converters).sort(), Object.keys(xJSON.mode).sort(), "extended JSON converters does not match known converter types");
		assert.eq(typeof converters[options.mode], "function");
		result = converters[options.mode].call(_this, options);
	}
	return result;
};


// Maybe consider handling Unicode properly in this regexp...?
// http://stackoverflow.com/questions/1661197/what-characters-are-valid-for-javascript-variable-names
// Create this once to avoid compiling the regexp every time.
xJSON._validIdentifierName = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

xJSON._fieldNameRequiresQuoting = function (fieldName) {
	if (fieldName.length == 0) {
		return true;
	}
	// https://mathiasbynens.be/notes/javascript-identifiers
	switch (fieldName) {
		// Keywords
		case "break":
		case "case":
		case "catch":
		case "continue":
		case "debugger":
		case "default":
		case "delete":
		case "do":
		case "else":
		case "finally":
		case "for":
		case "function":
		case "if":
		case "in":
		case "instanceof":
		case "new":
		case "return":
		case "switch":
		case "this":
		case "throw":
		case "try":
		case "typeof":
		case "var":
		case "void":
		case "while":
		case "with":

		// Future reserved words:
		case "class":
		case "const":
		case "enum":
		case "export":
		case "extends":
		case "import":
		case "super":
		// Future reserved words (strict mode):
		case "implements":
		case "interface":
		case "let":
		case "package":
		case "private":
		case "protected":
		case "public":
		case "static":
		case "yield":

		// Null literal:
		case "null":

		// Boolean literals:
		case "true":
		case "false":

		// Non-reserved words that are disallowed as variable names (in strict mode):
		case "eval":
		case "arguments":

		// ES3 reserved words:
		case "int":
		case "byte":
		case "char":
		case "goto":
		case "long":
		case "final":
		case "float":
		case "short":
		case "double":
		case "native":
		case "throws":
		case "boolean":
		case "abstract":
		case "volatile":
		case "transient":
		case "synchronized":
			return true;
	}

	// Valid identifier names don't require quotes, and vice-versa.
	return ! xJSON._validIdentifierName.test(fieldName);
};


/////////////////
// Monkey-patch in stuff that should probably live elsewhere
/////////////////

// Convenience functions for easily testing possibly absent booleans.
if (typeof _defaultTrue !== "function") {
	var _defaultTrue = function (value) {
		// If undefined, this will return true.
		return (value === undefined || !!value);
	};
}

if (typeof _defaultFalse !== "function") {
	var _defaultFalse = function (value) {
		// If undefined, this will return false.
		return !!value;
	};
}

// This is a very stupid hack because NumberLongs currently have no native way of getting the exact number as a string.
// It should live in types.js until a native implementation is done.
if (typeof NumberLong.prototype.toExactValue === "undefined") {
	NumberLong.prototype.toExactValue = function () {
		// RETURNS A STRING
		var s = this.toString(); // NumberLong(89342) or NumberLong("2349082234")
		s = s.substring(11, s.length - 1);
		if (s[0] === "\"") {
			s = s.substring(1, s.length - 1);
		}
		return s;
	};
}

// This should live in types.js
if (typeof String.prototype.toQuotedString === "undefined") {
	String.prototype.toQuotedString = function () {
		// This is the implementation from tojson(), with some improvements.
		// (Functionally, it's the same.)
		// A native C++ implementation would likely be a lot faster.
		var out = new Array(this.length);
		for (var i = 0; i < this.length; i++) {
			switch (this[i]) {
				case '"':
					out[i] = '\\"';
					break;
				case '\\':
					out[i] = '\\\\';
					break;
				case '\b':
					out[i] = '\\b';
					break;
				case '\f':
					out[i] = '\\f';
					break;
				case '\n':
					out[i] = '\\n';
					break;
				case '\r':
					out[i] = '\\r';
					break;
				case '\t':
					out[i] = '\\t';
					break;

				default: {
					var code = this.charCodeAt(i);
					// FIXME: Optionally print ALL non-ascii as \uXXXX
					if (code < 0x20){
						out[i] = '\\u00' + (code < 0x10 ? '0' : '') + code.toString(16);
					} else {
						out[i] = this[i];
					}
				}
			}
		}
		return '"' + out.join('') + '"';
	};
}



// Test suite
// FIXME: make this thorough/comprehensive, instead of this adhoc mish-mash of junk
xJSON.__runTestSuite = function () {


	function inlineprint(x) {
		print(x);
		return x;
	}


	function countlines(s) {
		var c = 0;
		for (var i = 0; i < s.length; i++) {
			if (s[i] === '\n') {
				c++;
			}
		}
		return c;
	}


	function convertShell(thing, opts, modifies) {
		var output = {};
		var options = { mode: "shell" };
		Object.extend(options, opts || {});
		var origOptions = Object.extend({}, options);
		output.str = toExtendedJSON(thing, options);
		print(output.str);
		assert.eq(0, bsonWoCompare(options, origOptions), "options were mangled");
		output.thing = eval(output.str);
		if ( ! modifies ) {
			assert.eq(0, bsonWoCompare( { a: thing }, { a: output.thing } ), "shell mode round-trip failed");
		}
		return output;
	}

	function convertStrict(thing, opts, modifies) {
		var output = {};
		var options = { mode: "strict" };
		Object.extend(options, opts || {});
		var origOptions = Object.extend({}, options);
		output.str = toExtendedJSON(thing, options);
		print(output.str);
		assert.eq(0, bsonWoCompare(options, origOptions), "options were mangled");
		output.thing = JSON.parse(output.str);
		if ( ! modifies ) {
			// Once the shell can read strict mode extended JSON (SERVER-6813), then check with bsonWoCompare that the above object matches the original thing.
		}
		return output;
	}



	print(toExtendedJSON(undefined, { mode: "shell" }));
	print(toExtendedJSON(undefined, { mode: "strict" }));
	print(toExtendedJSON(undefined, { mode: "strict", quoteAllFieldNames: false }));
	assert.eq(toExtendedJSON(undefined, { mode: "shell" }), "undefined");
	assert.eq(toExtendedJSON(undefined, { mode: "strict", oneLine: true }), '{ "$undefined" : true }');
	assert.eq(toExtendedJSON(undefined, { mode: "strict", oneLine: false }), '{ "$undefined" : true }');

	assert.eq(inlineprint(toExtendedJSON({ foo: "bar", baz: "fred" }, { mode: "strict", oneLine: true })), '{ "foo" : "bar", "baz" : "fred" }');
	assert.eq(inlineprint(toExtendedJSON({ foo: "bar", baz: "fred" }, { mode: "strict", oneLine: false })), '{ "foo" : "bar", "baz" : "fred" }');
	assert.eq(inlineprint(toExtendedJSON({ foo: "bar", baz: "fred" }, { mode: "strict", oneLine: false, collapseShortObjects: false })), '{\n\t"foo" : "bar",\n\t"baz" : "fred"\n}');

	assert.eq(inlineprint(toExtendedJSON({ foo: "bar", baz: "fred0123456789001234567890012345678900123456789001234567890012345678900123456789001234567890" }, { mode: "strict", oneLine: false })), '{\n\t"foo" : "bar",\n\t"baz" : "fred0123456789001234567890012345678900123456789001234567890012345678900123456789001234567890"\n}');
	assert.eq(inlineprint(toExtendedJSON({ foo: "bar", baz: "fred0123456789001234567890012345678900123456789001234567890012345678900123456789001234567890" }, { mode: "strict", oneLine: false, collapseShortObjects: false })), '{\n\t"foo" : "bar",\n\t"baz" : "fred0123456789001234567890012345678900123456789001234567890012345678900123456789001234567890"\n}');



	/////////////////
	// BinData
	/////////////////

	var binDataFull = HexData(0, "00112233445566778899aabbccddeeff");
	var binDataTrunc = HexData(0, "001122");

	// Use eval() to ensure roundtrippiness.
	assert.eq(inlineprint(toExtendedJSON(binDataFull, { mode: "shell" })), "BinData(0, \"ABEiM0RVZneImaq7zN3u/w==\")");
	assert.eq(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", preferHexData: true })), "HexData(0, \"00112233445566778899aabbccddeeff\")");
	assert.eq(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", truncateBinData: 3 })), "BinData(0, 'ABEi')");
	assert.eq(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", truncateBinData: 3, preferHexData: true })), "HexData(0, '001122')");

	assert.eq(0, bsonWoCompare(eval(inlineprint(toExtendedJSON(binDataFull, { mode: "shell" }))), binDataFull));
	assert.eq(0, bsonWoCompare(eval(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", preferHexData: true }))), binDataFull));
	assert.eq(0, bsonWoCompare(eval(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", truncateBinData: 3 }))), binDataTrunc));
	assert.eq(0, bsonWoCompare(eval(inlineprint(toExtendedJSON(binDataFull, { mode: "shell", truncateBinData: 3, preferHexData: true }))), binDataTrunc));

	assert.eq(JSON.parse(inlineprint(toExtendedJSON(binDataFull, { mode: "strict" })))["$binary"], "ABEiM0RVZneImaq7zN3u/w==");
	assert.eq(JSON.parse(inlineprint(toExtendedJSON(binDataFull, { mode: "strict", preferHexData: true })))["$binary"]["$hex"], "00112233445566778899aabbccddeeff");

	// remember to also check $truncated, $truncatedLength, $originalLength
	assert.eq(JSON.parse(inlineprint(toExtendedJSON(binDataFull, { mode: "strict", truncateBinData: 3 })))["$binary"], "ABEi");
	assert.eq(JSON.parse(inlineprint(toExtendedJSON(binDataFull, { mode: "strict", truncateBinData: 3, preferHexData: true })))["$binary"]["$hex"], "001122");


	var output = convertStrict(binDataFull, { truncateBinData: 3 }, true);
	assert.eq(output.thing["$binary"], binDataTrunc.base64());
	assert.eq(output.thing["$truncated"], true);
	assert.eq(output.thing["$truncatedLength"], 3);
	assert.eq(output.thing["$originalLength"], 16);

	var output = convertStrict(binDataFull, { truncateBinData: 3, preferExperimentalAlternateBinDataStrictFormat: true }, true);
	assert.eq(output.thing["$binary"]["$base64"], binDataTrunc.base64());
	assert.eq(output.thing["$truncated"], true);
	assert.eq(output.thing["$truncatedLength"], 3);
	assert.eq(output.thing["$originalLength"], 16);

	var output = convertStrict(binDataFull, { truncateBinData: 3, preferHexData: true }, true);
	assert.eq(output.thing["$binary"]["$hex"], binDataTrunc.hex());
	assert.eq(output.thing["$truncated"], true);
	assert.eq(output.thing["$truncatedLength"], 3);
	assert.eq(output.thing["$originalLength"], 16);



	/////////////////
	// String
	/////////////////

	var output = convertShell("foobarbaz");
	assert.eq(output.str, "\"foobarbaz\"");
	assert.eq(output.thing, "foobarbaz");
	var output = convertStrict("foobarbaz");
	assert.eq(output.str, "\"foobarbaz\"");
	assert.eq(output.thing, "foobarbaz");

	// FIXME: test quoting

	assert.eq(convertShell("foobarbaz", { truncateString: 4 }, true).thing, "foob...");
	assert.eq(convertStrict("foobarbaz", { truncateString: 4 }, true).thing, "foob...");

	assert.eq(convertShell("foobarbaz", { truncateString: 8 }, true).thing, "foobarba...");
	assert.eq(convertStrict("foobarbaz", { truncateString: 8 }, true).thing, "foobarba...");

	assert.eq(convertShell("foobarbaz", { truncateString: 9 }, true).thing, "foobarbaz");
	assert.eq(convertStrict("foobarbaz", { truncateString: 9 }, true).thing, "foobarbaz");

	assert.eq(convertShell("foobarbaz", { truncateString: 10 }, true).thing, "foobarbaz");
	assert.eq(convertStrict("foobarbaz", { truncateString: 10 }, true).thing, "foobarbaz");




	/////////////////
	// NumberInt
	/////////////////

	var output = convertShell(NumberInt(12345));
	assert.eq(output.str, "NumberInt(12345)");
	var output = convertStrict(NumberInt(12345));
	assert.eq(output.str, "{ \"$numberInt\" : 12345 }");
	assert.eq(0, bsonWoCompare(output.thing, { "$numberInt" : 12345 } ));

	var output = convertShell(NumberInt(12345), { preferNumberIntConversion: true }, true);
	assert.eq(output.str, "12345");
	assert.eq(output.thing, 12345);
	var output = convertStrict(NumberInt(12345), { preferNumberIntConversion: true }, true);
	assert.eq(output.str, "12345");
	assert.eq(output.thing, 12345);

	var output = convertShell(NumberInt(12345), { preferNumberIntAsString: true } );
	assert.eq(output.str, "NumberInt(\"12345\")");
	var output = convertStrict(NumberInt(12345), { preferNumberIntAsString: true } );
	assert.eq(output.str, "{ \"$numberInt\" : \"12345\" }");
	assert.eq(0, bsonWoCompare(output.thing, { "$numberInt" : "12345" } ));







	assert.eq(countlines(inlineprint(toExtendedJSON(foo, { mode: "shell", oneLine: true }))), 0);
	assert.eq(countlines(inlineprint(toExtendedJSON(foo, { mode: "strict", oneLine: true }))), 0);






	var negativeDate = new Date();
	negativeDate.setTime( -negativeDate.getTime() );

	var foo = {
		aa: 3,
		bb: "",
		cc: "dd",
		ee: undefined,
		ff: null,
		gg: function () {},
		hh: NumberLong(4),
		ii: NumberInt(5),
		jj: {
			kk: 6,
			ll: "mm"
		},
		nn: MinKey,
		oo: MaxKey,
		pp: DBRef("bleh", "sdflkj"),
		pp2: DBRef("bleh", "sdflkj", "asdf"),
		pp3: DBPointer("bleh", ObjectId()),
		qq: ObjectId(),
		rr: new Date(),
		ss: ISODate(),
		ss2: negativeDate,
		tt: Timestamp(7,8),
		uu: [ 9, "vv" ],
		ww: BinData(0, "xx=="),
		ww2: HexData(0, "00112233445566778899aabbccddeeff"),
		yy: true,
		zz: false,
		aaa: /bbb/,
		bbb: { },
		ccc: { },
		ddd: [ ],
		eee: [ ],
		"f.f": "f.f"
	};

	print(toExtendedJSON(foo, { mode: "shell" }));
	print(toExtendedJSON(foo, { mode: "shell", pedantic: true }));
	//print(toExtendedJSON(foo, { mode: "shell", includeEpochDate: false }));
	//print(toExtendedJSON(foo, { mode: "shell", includeEpochDate: false, preferISODate: false }));
	//print(toExtendedJSON(foo, { mode: "shell", includeEpochDate: true, preferISODate: false }));
	print(toExtendedJSON(foo, { mode: "strict" }));
	print(toExtendedJSON(foo, { mode: "strict", pedantic: true }));


	// FIXME: test pedantic: true and human: true
	// even if just to confirm that they don't mangle the options object


	//print(toExtendedJSON(foo, { mode: "strict", includeEpochDate: false }));


};



