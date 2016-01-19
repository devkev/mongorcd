// Compare _ids of documents in a collection between two servers
//
// Useful for checking for basic inconsistency between replset members,
// although repllag must be considered in this case (best run on a quiesced
// set/collection).  Since it uses the _id index only, it is safe to run on
// production systems.
//
// Usage:
//
//   If using auth, specify username, password and auth db (which defaults to "admin":
//     > compareIds.auth("USERNAME", "PASSWORD", "AUTHDB")
//
//   Compare the collection "foo.bar" here ("this") with the same collection on "other.host.com:port" ("there"):
//     > compareIds("foo.bar", "other.host.com:port")
//
// Example (old output style, but it illustrates the concept):
//
//   $ mongo --port 18528 --eval 'db.test.find().forEach(printjson)'
//   MongoDB shell version: 2.6.7
//   connecting to: 127.0.0.1:18528/test
//   { "_id" : "both" }
//   { "_id" : "a" }
//   { "_id" : "one a" }
//   { "_id" : "two both" }
//   { "_id" : "you a" }
//   { "_id" : "one aa" }
//   $ mongo --port 18529 --eval 'rs.slaveOk(); db.test.find().forEach(printjson)'
//   MongoDB shell version: 2.6.7
//   connecting to: 127.0.0.1:18529/test
//   { "_id" : "both" }
//   { "_id" : "b" }
//   { "_id" : "one b" }
//   { "_id" : "two both" }
//   { "_id" : "you b" }
//   { "_id" : "one bb" }
//   $ mongo --port 18528 --eval 'load("compareids.js"); compareIds("test.test", "localhost:18529")'
//   MongoDB shell version: 2.6.7
//   connecting to: 127.0.0.1:18528/test
//   2015-02-12T00:01:45.474Z: collectionName: test.test
//   2015-02-12T00:01:45.475Z: this: connection to 127.0.0.1:18528
//   2015-02-12T00:01:45.475Z: THAT: connection to localhost:18529
//   2015-02-12T00:01:45.475Z: collection count: this: 6
//   2015-02-12T00:01:45.476Z: collection count: THAT: 6
//   2015-02-12T00:01:45.478Z: _id count: this: 6
//   2015-02-12T00:01:45.478Z: _id count: THAT: 6
//   2015-02-12T00:01:45.479Z: _id range: this: "a" -> "you a"
//   2015-02-12T00:01:45.482Z: _id range: THAT: "b" -> "you b"
//   2015-02-12T00:01:45.482Z: only this: "a"
//   2015-02-12T00:01:45.483Z: only THAT: "b"
//   2015-02-12T00:01:45.483Z: only this: "one a"
//   2015-02-12T00:01:45.483Z: only this: "one aa"
//   2015-02-12T00:01:45.483Z: only THAT: "one b"
//   2015-02-12T00:01:45.483Z: only THAT: "one bb"
//   2015-02-12T00:01:45.483Z: only this: "you a"
//   2015-02-12T00:01:45.483Z: only THAT: "you b"
//   2015-02-12T00:01:45.483Z: final progress: 8: this (5): "you a", THAT (5): "you b"
//
// During long runs, it will output a progress line once per minute that looks like the "final progress" line (except without the word "final").
//
// Example (illustrating actual output):
//
//   > compareIds.progressSecs = 5
//   5
//   > compareIds("test.test", "localhost:26011")
//   2016-01-19T00:26:56.351Z: collectionName: test.test
//   
//   2016-01-19T00:26:56.352Z: this: connection to 127.0.0.1:26010
//   2016-01-19T00:26:56.352Z: THAT: connection to localhost:26011
//   
//   2016-01-19T00:26:56.352Z: collection count: this: 688737
//   2016-01-19T00:26:56.353Z: collection count: THAT: 688737
//   
//   2016-01-19T00:26:56.353Z: _id count: this: 688737
//   2016-01-19T00:26:56.354Z: _id count: THAT: 688737
//   
//   2016-01-19T00:26:56.356Z: _id range: this: ObjectId("569971eaf35b4b6416372056") -> ObjectId("56998b2df35b4b6416807ea3")
//   2016-01-19T00:26:56.357Z: _id range: THAT: ObjectId("569971eaf35b4b6416372056") -> ObjectId("56998b2df35b4b6416807ea3")
//   
//   2016-01-19T00:26:56.359Z: progress will be output every 5 secs
//   2016-01-19T00:27:01.359Z: progress: 83000: this (83000): ObjectId("56997496f35b4b64163dcdd2"), THAT (83000): ObjectId("56997496f35b4b64163dcdd2")
//   2016-01-19T00:27:06.359Z: progress: 173468: this (173468): ObjectId("56997609f35b4b641642906d"), THAT (173468): ObjectId("56997609f35b4b641642906d")
//   2016-01-19T00:27:11.359Z: progress: 265258: this (265258): ObjectId("569976f9f35b4b64164679ff"), THAT (265258): ObjectId("569976f9f35b4b64164679ff")
//   2016-01-19T00:27:16.359Z: progress: 353841: this (353841): ObjectId("569977eaf35b4b64164a6bf6"), THAT (353841): ObjectId("569977eaf35b4b64164a6bf6")
//   2016-01-19T00:27:21.359Z: progress: 438182: this (438182): ObjectId("569978f7f35b4b64164ea694"), THAT (438182): ObjectId("569978f7f35b4b64164ea694")
//   2016-01-19T00:27:26.359Z: progress: 536917: this (536917): ObjectId("56997a67f35b4b641653cd12"), THAT (536917): ObjectId("56997a67f35b4b641653cd12")
//   2016-01-19T00:27:31.359Z: progress: 622842: this (622842): ObjectId("56997c19f35b4b641658bb71"), THAT (622842): ObjectId("56997c19f35b4b641658bb71")
//   2016-01-19T00:27:34.819Z: final progress: 688736: this (688736): ObjectId("56998b2df35b4b6416807ea3"), THAT (688736): ObjectId("56998b2df35b4b6416807ea3")
//
 
var compareIds = function (collectionName, otherHostport) {
	assert(collectionName && typeof(collectionName) == "string", "ERROR: Usage: compareIds(\"DATABASE.COLLECTION\", \"other.host.com:port\")");
	assert(otherHostport  && typeof(otherHostport)  == "string", "ERROR: Usage: compareIds(\"DATABASE.COLLECTION\", \"other.host.com:port\")");

	print(new Date().toISOString() + ": collectionName: " + collectionName);
	print();

	var thisMongo = db.getMongo();
	var THATMongo = new Mongo(otherHostport);

	print(new Date().toISOString() + ": this: " + thisMongo);
	print(new Date().toISOString() + ": THAT: " + THATMongo);
	print();

	if (compareIds._user) {
		assert(thisMongo.getDB(compareIds._authDB).auth(compareIds._user, compareIds._pwd), "ERROR: couldn't login to this: " + thisMongo.host + "/" + compareIds._authDB);
		assert(THATMongo.getDB(compareIds._authDB).auth(compareIds._user, compareIds._pwd), "ERROR: couldn't login to THAT: " + THATMongo.host + "/" + compareIds._authDB);
	}

	thisMongo.setSlaveOk();
	THATMongo.setSlaveOk();

	var thisCollection = thisMongo.getCollection(collectionName);
	var THATCollection = THATMongo.getCollection(collectionName);

	print(new Date().toISOString() + ": collection count: this: " + thisCollection.count());
	print(new Date().toISOString() + ": collection count: THAT: " + THATCollection.count());
	print();

	var thisCursor = thisCollection.find({}, {_id:1}).sort({_id:1}).hint({_id:1});
	var THATCursor = THATCollection.find({}, {_id:1}).sort({_id:1}).hint({_id:1});

	print(new Date().toISOString() + ": _id count: this: " + thisCursor.count());
	print(new Date().toISOString() + ": _id count: THAT: " + THATCursor.count());
	print();

	assert(thisCursor.hasNext() || THATCursor.hasNext(), "ERROR: both collections are empty");
	assert(thisCursor.hasNext(), "ERROR: \"this\" collection is empty");
	assert(THATCursor.hasNext(), "ERROR: \"THAT\" collection is empty");

	print(new Date().toISOString() + ": _id range: this: " + tojson(thisCollection.find({}, {_id:1}).sort({_id:1}).hint({_id:1}).limit(1).next()._id) + " -> " + tojson(thisCollection.find({}, {_id:1}).sort({_id:-1}).hint({_id:1}).limit(1).next()._id));
	print(new Date().toISOString() + ": _id range: THAT: " + tojson(THATCollection.find({}, {_id:1}).sort({_id:1}).hint({_id:1}).limit(1).next()._id) + " -> " + tojson(THATCollection.find({}, {_id:1}).sort({_id:-1}).hint({_id:1}).limit(1).next()._id));
	print();

	var thisId = thisCursor.next();
	var THATId = THATCursor.next();

	var thisAdvance;
	var THATAdvance;
	var cmp;
	var num = 0;
	var thisNum = 0;
	var THATNum = 0;
	var start = Date.now();
	var progressSecs = compareIds.progressSecs;

	print(new Date().toISOString() + ": progress will be output every " + progressSecs + " secs");
	while (1) {
		//if (num % 3 == 0) {
		if (Date.now() - start >= progressSecs * 1000) {  // output progress every so often
			print(new Date().toISOString() + ": progress: " + num + ": this (" + thisNum + "): " + tojson(thisId._id) + ", THAT (" + THATNum + "): " + tojson(THATId._id));
			start = Date.now();
		}

		//print("cmp " + tojson(thisId._id) + " - " + tojson(THATId._id));
		cmp = bsonWoCompare(thisId, THATId);
		if (cmp == 0) {
			//print("both: " + tojson(thisId._id));
			thisAdvance = true;
			THATAdvance = true;
		} else if (cmp < 0) { // thisId < THATId
			print(new Date().toISOString() + ": only this: " + tojson(thisId._id));
			thisAdvance = true;
		} else if (cmp > 0) { // thisId > THATId
			print(new Date().toISOString() + ": only THAT: " + tojson(THATId._id));
			THATAdvance = true;
		}

		if ( ! thisCursor.hasNext() && ! THATCursor.hasNext()) {
			break;
		}

		if (thisAdvance && thisCursor.hasNext()) {
			thisAdvance = false;
			thisId = thisCursor.next();
			thisNum++;
		}
		if (THATAdvance && THATCursor.hasNext()) {
			THATAdvance = false;
			THATId = THATCursor.next();
			THATNum++;
		}
		num++;
	}

	// If the last pair didn't match, then output the other one.
	if (cmp > 0) {
		print(new Date().toISOString() + ": only this: " + tojson(thisId._id));
	} else if (cmp < 0) {
		print(new Date().toISOString() + ": only THAT: " + tojson(THATId._id));
	}

	print(new Date().toISOString() + ": final progress: " + num + ": this (" + thisNum + "): " + tojson(thisId._id) + ", THAT (" + THATNum + "): " + tojson(THATId._id));

};

compareIds.progressSecs = 60;

compareIds.auth = function (user, pwd, authDB) {
	assert(user && pwd, "ERROR: Usage: compareIds.auth(\"USERNAME\", \"PASSWORD\"[, \"AUTHDB\"]) (authdb defaults to \"admin\"");
	compareIds._user = user;
	compareIds._pwd = pwd;
	if (typeof(authDB) != "string") {
		authDB = "admin"
	}
	compareIds._authDB = authDB;
};
