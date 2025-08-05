#pragma once
#include <string>
#include <vector>
#include <set>
#include <unordered_map>
#include "lru_cache.h"
#include "lfu_cache.h"
#include "data_types.h"
#include <mutex>
#include <json.hpp>

class DB {
public:
    // String operations
    virtual void set(const std::string& key, const std::string& value) = 0;
    virtual bool get(const std::string& key, std::string& value) = 0;
    virtual bool incr(const std::string& key, int64_t& result) = 0;
    virtual bool decr(const std::string& key, int64_t& result) = 0;
    
    // List operations
    virtual bool lpush(const std::string& key, const std::vector<std::string>& values) = 0;
    virtual bool rpush(const std::string& key, const std::vector<std::string>& values) = 0;
    virtual bool lpop(const std::string& key, std::string& value) = 0;
    virtual bool rpop(const std::string& key, std::string& value) = 0;
    virtual bool llen(const std::string& key, size_t& length) = 0;
    virtual bool lrange(const std::string& key, int start, int stop, std::vector<std::string>& result) = 0;
    
    // Set operations
    virtual bool sadd(const std::string& key, const std::vector<std::string>& members) = 0;
    virtual bool srem(const std::string& key, const std::vector<std::string>& members) = 0;
    virtual bool smembers(const std::string& key, std::set<std::string>& members) = 0;
    virtual bool scard(const std::string& key, size_t& count) = 0;
    virtual bool sismember(const std::string& key, const std::string& member) = 0;
    
    // Hash operations
    virtual bool hset(const std::string& key, const std::string& field, const std::string& value) = 0;
    virtual bool hget(const std::string& key, const std::string& field, std::string& value) = 0;
    virtual bool hdel(const std::string& key, const std::vector<std::string>& fields) = 0;
    virtual bool hgetall(const std::string& key, std::unordered_map<std::string, std::string>& result) = 0;
    virtual bool hkeys(const std::string& key, std::vector<std::string>& fields) = 0;
    virtual bool hvals(const std::string& key, std::vector<std::string>& values) = 0;
    
    // General operations
    virtual void del(const std::string& key) = 0;
    virtual bool exists(const std::string& key) = 0;
    virtual DataType type(const std::string& key) = 0;
    virtual std::vector<std::string> keys(const std::string& pattern = "*") = 0;
    virtual void save(const std::string& filename) = 0;
    virtual void load(const std::string& filename) = 0;
    virtual void expire(const std::string& key, int seconds) = 0;
    virtual void flushdb() = 0;
    virtual size_t dbsize() = 0;
    
    virtual ~DB() = default;
};

class EnhancedDB : public DB {
public:
    EnhancedDB(size_t capacity);
    
    // String operations
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    bool incr(const std::string& key, int64_t& result) override;
    bool decr(const std::string& key, int64_t& result) override;
    
    // List operations
    bool lpush(const std::string& key, const std::vector<std::string>& values) override;
    bool rpush(const std::string& key, const std::vector<std::string>& values) override;
    bool lpop(const std::string& key, std::string& value) override;
    bool rpop(const std::string& key, std::string& value) override;
    bool llen(const std::string& key, size_t& length) override;
    bool lrange(const std::string& key, int start, int stop, std::vector<std::string>& result) override;
    
    // Set operations
    bool sadd(const std::string& key, const std::vector<std::string>& members) override;
    bool srem(const std::string& key, const std::vector<std::string>& members) override;
    bool smembers(const std::string& key, std::set<std::string>& members) override;
    bool scard(const std::string& key, size_t& count) override;
    bool sismember(const std::string& key, const std::string& member) override;
    
    // Hash operations
    bool hset(const std::string& key, const std::string& field, const std::string& value) override;
    bool hget(const std::string& key, const std::string& field, std::string& value) override;
    bool hdel(const std::string& key, const std::vector<std::string>& fields) override;
    bool hgetall(const std::string& key, std::unordered_map<std::string, std::string>& result) override;
    bool hkeys(const std::string& key, std::vector<std::string>& fields) override;
    bool hvals(const std::string& key, std::vector<std::string>& values) override;
    
    // General operations
    void del(const std::string& key) override;
    bool exists(const std::string& key) override;
    DataType type(const std::string& key) override;
    std::vector<std::string> keys(const std::string& pattern = "*") override;
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void flushdb() override;
    size_t dbsize() override;
    
    // Stats access
    size_t get_hits() const;
    size_t get_misses() const;
    
    ~EnhancedDB() override;

private:
    class EnhancedCache* cache_;
    std::unordered_map<std::string, DataValue> storage_;
    
    void sync_to_cache(const std::string& key);
    void sync_from_cache();
};

class LRUDB : public DB {
public:
    LRUDB(size_t capacity);
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    bool incr(const std::string& key, int64_t& result) override { return false; } // Not implemented
    bool decr(const std::string& key, int64_t& result) override { return false; } // Not implemented
    bool lpush(const std::string& key, const std::vector<std::string>& values) override { return false; }
    bool rpush(const std::string& key, const std::vector<std::string>& values) override { return false; }
    bool lpop(const std::string& key, std::string& value) override { return false; }
    bool rpop(const std::string& key, std::string& value) override { return false; }
    bool llen(const std::string& key, size_t& length) override { return false; }
    bool lrange(const std::string& key, int start, int stop, std::vector<std::string>& result) override { return false; }
    bool sadd(const std::string& key, const std::vector<std::string>& members) override { return false; }
    bool srem(const std::string& key, const std::vector<std::string>& members) override { return false; }
    bool smembers(const std::string& key, std::set<std::string>& members) override { return false; }
    bool scard(const std::string& key, size_t& count) override { return false; }
    bool sismember(const std::string& key, const std::string& member) override { return false; }
    bool hset(const std::string& key, const std::string& field, const std::string& value) override { return false; }
    bool hget(const std::string& key, const std::string& field, std::string& value) override { return false; }
    bool hdel(const std::string& key, const std::vector<std::string>& fields) override { return false; }
    bool hgetall(const std::string& key, std::unordered_map<std::string, std::string>& result) override { return false; }
    bool hkeys(const std::string& key, std::vector<std::string>& fields) override { return false; }
    bool hvals(const std::string& key, std::vector<std::string>& values) override { return false; }
    void del(const std::string& key) override;
    bool exists(const std::string& key) override { return false; } // Not implemented
    DataType type(const std::string& key) override { return DataType::STRING; }
    std::vector<std::string> keys(const std::string& pattern = "*") override { return {}; }
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void flushdb() override {}
    size_t dbsize() override { return 0; }
    ~LRUDB() override = default;
    LRUCache* cache_;
};

class LFUDB : public DB {
public:
    LFUDB(size_t capacity);
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    bool incr(const std::string& key, int64_t& result) override { return false; } // Not implemented
    bool decr(const std::string& key, int64_t& result) override { return false; } // Not implemented
    bool lpush(const std::string& key, const std::vector<std::string>& values) override { return false; }
    bool rpush(const std::string& key, const std::vector<std::string>& values) override { return false; }
    bool lpop(const std::string& key, std::string& value) override { return false; }
    bool rpop(const std::string& key, std::string& value) override { return false; }
    bool llen(const std::string& key, size_t& length) override { return false; }
    bool lrange(const std::string& key, int start, int stop, std::vector<std::string>& result) override { return false; }
    bool sadd(const std::string& key, const std::vector<std::string>& members) override { return false; }
    bool srem(const std::string& key, const std::vector<std::string>& members) override { return false; }
    bool smembers(const std::string& key, std::set<std::string>& members) override { return false; }
    bool scard(const std::string& key, size_t& count) override { return false; }
    bool sismember(const std::string& key, const std::string& member) override { return false; }
    bool hset(const std::string& key, const std::string& field, const std::string& value) override { return false; }
    bool hget(const std::string& key, const std::string& field, std::string& value) override { return false; }
    bool hdel(const std::string& key, const std::vector<std::string>& fields) override { return false; }
    bool hgetall(const std::string& key, std::unordered_map<std::string, std::string>& result) override { return false; }
    bool hkeys(const std::string& key, std::vector<std::string>& fields) override { return false; }
    bool hvals(const std::string& key, std::vector<std::string>& values) override { return false; }
    void del(const std::string& key) override;
    bool exists(const std::string& key) override { return false; } // Not implemented
    DataType type(const std::string& key) override { return DataType::STRING; }
    std::vector<std::string> keys(const std::string& pattern = "*") override { return {}; }
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void flushdb() override {}
    size_t dbsize() override { return 0; }
    ~LFUDB() override;
    LFUCache* cache_;
};

// Factory function for DB
DB* create_db(const std::string& policy, size_t capacity);
