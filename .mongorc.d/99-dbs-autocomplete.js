
// Usage:
//   Instead of doing
//
//       use dbname
//       db.collection.foobar(...)
//
//   which is a pain, you can do
//
//       dbs.dbname.collection.foobar(...)
//
//   which is nice, and sensible.
//
// Bugs/quirks:
//
//   - Changes to the dbs that are present won't be noticed until/unless you
//     hit tab at least once.  Which I normally do anyway.
//
//   - Can't create new databases this way.  Might be impossible without
//     internal mongo shell magic (which is I think how db.foo.insert() does it
//     for creating new collections).  Or enabling --harmony_proxies, which
//     would make it very easy.  Maybe try overriding hasOwnProperty(), or
//     propertyIsEnumerable(), or Object.getOwnPropertyNames(), or
//     Object.keySet(), or Object.keys(), or Object.hasOwnProperty(), or
//     Object.propertyIsEnumerable(), or ...


DBS = function (mongo) {
	this._mongo = mongo;
	DBS.autocomplete(this);
};

DBS.autocomplete = function (obj) {
	var dblistnow = obj._mongo.getDBNames();
	var dbsnow = {};
	var i;
	var dbname;
	for (i = 0; i < dblistnow.length; i++) {
		dbname = dblistnow[i];
		if ( ! (dbname in dbsnow) ) {
			dbsnow[dbname] = {};
		}
		dbsnow[dbname].now = true;
	}
	if (obj._dblist) {
		for (i = 0; i < obj._dblist.length; i++) {
			dbname = obj._dblist[i];
			if ( ! (dbname in dbsnow) ) {
				dbsnow[dbname] = {};
			}
			dbsnow[dbname].then = true;
		}
	}
	for (dbname in dbsnow) {
		var present = dbsnow[dbname];
		if (present.now && present.then) {
			// was there before and now, nothing to do
		} else if (present.now) {
			// has been added since last time
			obj[dbname] = obj._mongo.getDB(dbname);
		} else if (present.then) {
			// has gone away since last time
			delete obj[dbname];
		} else {
			// impossible
		}
	}
	obj._dblist = dblistnow;
	return obj._dblist;
};

if (db) {
	dbs = new DBS(db.getMongo());
}
