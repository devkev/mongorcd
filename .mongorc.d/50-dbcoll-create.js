
// So to drop a collection, you do db.foo.drop().  Why then is it that to
// create a collection, you do db.createCollection("foo")?  Surely
// db.foo.createCollection() or db.foo.create() makes much more sense?
// That's right, it sure does.

DBCollection.prototype.createCollection = function (opts) {
	return this.getDB().createCollection(this.getName(), opts);
};

DBCollection.prototype.create = DBCollection.prototype.createCollection;
