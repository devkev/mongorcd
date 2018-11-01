
// Usage:
//
//   `dbs.dbname` is handy sugar for `db.getSiblingDB("dbname")`.
//
//   It's less typing and works with tab completion.
//
//   So instead of doing:
//
//       db.getSiblingDB("dbname").collection.foobar(...)
//
//   which is a pain, you can instead just do:
//
//       dbs.dbname.collection.foobar(...)

DBS = function (mongo) {
	this._mongo = mongo;
};

DBS.autocomplete = function (obj) {
	// getDBNames() doesn't use `nameOnly` like it should, probably because that's 3.6+ and it pre-dates that (and figuring out if it can be sent or not is likely a pain - or maybe it can just always be sent, and is harmless on old servers?).
	// Oh well.
	return obj._mongo.getDBNames();
};

DBS.prototype.shellPrint = function () {
	shellHelper.show("dbs");
};

// Slightly surprising that this doesn't already exist.  Only works on 3.6+.
Mongo.prototype.hasDB = function (dbname, driverSession = this._getDefaultSession()) {
	// dbname is usually a string, but could be a regex or some other query expression.
    var cmdObj = {listDatabases: 1, nameOnly: true, filter: { name: dbname }};
    cmdObj = driverSession._serverSession.injectSessionId(cmdObj);

    var res = this.adminCommand(cmdObj);
    if (!res.ok)
        throw _getErrorWithCode(res, "listDatabases failed:" + tojson(res));
	// FIXME: on servers earlier than 3.6, this will be incorrect.
    return res.databases.length > 0;
};

Mongo.prototype.getDBS = function () {
	// Could proxy-ify the `DBS` function itself, to trap `construct`, but that's more effort than it's worth.
	return new Proxy( new DBS(this), {
		get: function(obj, prop) {
			// Prevent autocomplete from barfing.
			if (prop === Symbol.toPrimitive) return function () { return "DBS"};

			if (prop in obj) return obj[prop];

			return db.getSiblingDB(prop);
		},
		set: function(obj, prop) {
			throw("Can't set properties on dbs");
		},
		has: function(obj, prop) {
			return obj._mongo.hasDB(prop);
		},
		// Doesn't work (eg. `for (i in dbs) print(i)`), but don't really care why.
		ownKeys: function(obj) {
			// See above note about getDBNames().
			return obj._mongo.getDBNames();
		},
	} );
};

if (typeof(db) !== "undefined") {
	dbs = db.getMongo().getDBS();
}
