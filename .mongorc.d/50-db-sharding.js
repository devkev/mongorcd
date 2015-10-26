
// Various sharding related operations directly on databases and collections,
// as opposed to in sh.* (and passing through string db/coll names, ugh).
// (Why wasn't the interface originally designed like this??)


// use foo
// db.enableSharding()
//  - same as sh.enableSharding("foo")
//
// db.bar.shardCollection(key, opts)
//  - same as sh.shardCollection("foo.bar", key, opts)
//
// db.bar.moveChunk(find, to_shard)
//  - same as sh.moveChunk("foo.bar", find, to_shard)
//
// db.bar.splitAt(middle)
//  - same as sh.splitAt("foo.bar", middle)
//
// db.bar.splitFind(find)
//  - same as sh.splitFind("foo.bar", find)
//
// db.bar.addTagRange(min, max, tag)
//  - same as sh.addTagRange("foo.bar", min, max, tag)
//
// db.bar.disableBalancing()
//  - same as sh.disableBalancing("foo.bar")
//
// db.bar.enableBalancing()
//  - same as sh.enableBalancing("foo.bar")


if (sh) {

	DB.prototype.enableSharding = function () {
		return sh.enableSharding(this.getName());
	};

	DBCollection.prototype.shardCollection = function (key, unique) {
		return sh.shardCollection(this.getFullName(), key, unique);
	};

	DBCollection.prototype.moveChunk = function (find, to) {
		return sh.moveChunk(this.getFullName(), find, to);
	};

	DBCollection.prototype.splitAt = function (middle) {
		return sh.splitAt(this.getFullName(), middle);
	};

	DBCollection.prototype.splitFind = function (find) {
		return sh.splitFind(this.getFullName(), find);
	};

	DBCollection.prototype.addTagRange = function (min, max, tag) {
		return sh.addTagRange(this.getFullName(), min, max, tag);
	};

	DBCollection.prototype.disableBalancing = function () {
		return sh.disableBalancing(this.getFullName());
	};

	DBCollection.prototype.enableBalancing = function () {
		return sh.enableBalancing(this.getFullName());
	};

}

