
// sh.getShards()
//  - return the list of shards from config.shards
//
// sh.forEachShard(func)
//  - calls the `func` function for each shard configured in config.shards


if (sh) {
	sh.getShards = function() {
		return db.getSiblingDB("config").shards.find();
	}

	sh.forEachShard = function(f) {
		sh.getShards().forEach(f);
	}
}

