
// Various helpers for getting/setting parameters, particularly logLevel.


// db.getParameter()
//  - get values of all available parameters
//
// db.getParameter("help")
//  - get help text for the server getParameter cmd
//
// db.getParameter("*")
//  - same as db.getParameter()
//
// db.getParameter("param")
//  - get value of parameter named "param"
//
// db.getParameter( [ "param1", "param2", ... ], { param3: 1, param4: 1, ... }, "param5", "param6", ... )
//  - list values of param1, param2, param3, param4, param5, param6, ...
//
//  - if more than 1 param is requested, then the results of each param is in a separate subdocument, eg:
//      > db.getParameter("verboseQueryLogging")
//      { "verboseQueryLogging" : false, "ok" : 1 }
//      > db.getParameter("verboseQueryLogging", [ "syncdelay" ])
//      {
//              "verboseQueryLogging" : {
//                      "verboseQueryLogging" : false,
//                      "ok" : 1
//              },
//              "syncdelay" : {
//                      "syncdelay" : 60,
//                      "ok" : 1
//              }
//      }



// db.setParameter()
// db.setParameter("help")
//  - get help text for the server setParameter cmd
//
// db.setParameter("param", value)
//  - set the value of parameter named "param" to `value`
//
// db.setParameter( { param1: value1, param2: value2, ... } )
//  - sets the values of multiple parameters



// db.getLogLevel()
//  - returns current value of the logLevel parameter
//  - NOTE: untested on 3.0-style per-component loglevels
//
// db.setLogLevel(level)
//  - sets the value of the logLevel parameter to `level`
//  - NOTE: conflicts with the 3.0 per-component db.setLogLeve() function
//    https://docs.mongodb.org/manual/reference/method/db.setLogLevel/
//  - NOTE: untested on 3.0-style per-component loglevels
//
// db.logLevel()
//  - same as db.getLogLevel()
//
// db.logLevel(level)
//  - same as db.setLogLevel(level)



DB.prototype.getParameter = function () {
	var params = {};
	var ordered = [];

	var add = function (n) {
		if ( ! (n in params) ) {
			params[n] = 1;
			ordered.push(n);
		}
	}

	for (var arg = 0; arg < arguments.length; arg++) {
		var name = arguments[arg];
		// This is a pathetic excuse for Array.isArray()
		if (typeof(name) === "object" && "length" in name && typeof(name.length) === "number") {
			for (var i = 0; i < name.length; i++) {
				add(name[i]);
			}
		} else if (typeof(name) === "object") {
			for (var i in name) {
				if (name.hasOwnProperty(i)) {
					add(i);
				}
			}
		} else {
			add(name);
		}
	}

	var results = {};
	if (ordered.length == 0) {
		results = this.adminCommand( { getParameter: "*" } );
	} else if (ordered.length == 1) {
		var cmd = { getParameter: 1 };
		if (ordered[0] == "help") {
			cmd["help"] = true;
			results = this.adminCommand(cmd);
			if (results.ok) {
				results = results.help;
			}
		} else if (ordered[0] == "*") {
			cmd["getParameter"] = "*"
			results = this.adminCommand(cmd);
		} else {
			cmd[ordered[0]] = 1;
			results = this.adminCommand(cmd);
		}
	} else {
		for (var i = 0; i < ordered.length; i++) {
			var cmd = { getParameter: 1 };
			cmd[ordered[i]] = 1;
			results[ordered[i]] = this.adminCommand(cmd);
		}
	}
	return results;
};



DB.prototype.setParameter = function (name, value) {
	var cmd = { setParameter: 1 };
	var results;
	if (name == "help" || typeof(name) === "undefined") {
		cmd["help"] = true;
		results = this.adminCommand(cmd);
		if (results.ok) {
			results = results.help;
		}
	} else if (typeof(name) === "object") {
		Object.extend(cmd, name);
		results = this.adminCommand(cmd);
	} else {
		cmd[name] = value;
		results = this.adminCommand(cmd);
	}
	return results;
};



DB.prototype.getLogLevel = function () {
	var result = this.getParameter("logLevel");
	if (result.ok) {
		return result.logLevel;
	}
};

DB.prototype.setLogLevel = function (level) {
	return this.setParameter("logLevel", level);
};

DB.prototype.logLevel = function (value) {
	if (typeof(value) === "undefined") {
		return this.getLogLevel();
	}
	return this.setLogLevel(value);
};

