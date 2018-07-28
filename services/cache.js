const mongoose = require("mongoose");
const redis    = require("redis");
const util     = require("util");
const keys     = require("../config/keys");

const redisClient = redis.createClient(keys.redisUrl);
const exec        = mongoose.Query.prototype.exec;

redisClient.hget = util.promisify(redisClient.hget);

mongoose.Query.prototype.cache = function (options = { key: "" }) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key);
  return this;
}

mongoose.Query.prototype.exec = async function() {

  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(Object.assign(
    {},
    this.getQuery(),{
      collection: this.mongooseCollection.name
    },
  ));

  // Check if we have a value for "key" in redis
  const cacheValue = await redisClient.hget(this.hashKey, key);

  // If we do, return that
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc) ?
           doc.map(d => new this.model(d)) :
           new this.model(doc);
  }

  // Otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);

  redisClient.hset(this.hashKey, key, JSON.stringify(result), "EX", 60);

  return result;
}

module.exports = {
  clearHash(hashKey = "") {
    redisClient.del(JSON.stringify(hashKey));
  }
}