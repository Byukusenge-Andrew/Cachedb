#include "db.h"
#include "lru_cache.h"
#include "lfu_cache.h"
#include "enhanced_cache.h"
#include "data_types.h"
#include <fstream>
#include <json.hpp>
#include <mutex>
#include <string>
#include <sstream>

static const char* AOF_FILENAME = "db.aof";

class AOFLogger {
  public:
    static void log(const std::string& entry) {
        std::ofstream aof(AOF_FILENAME, std::ios::app);
        aof << entry << "\n";
    }
    static void replay(LRUDB* db) {
        std::ifstream aof(AOF_FILENAME);
        std::string line;
        while (std::getline(aof, line)) {
            std::istringstream iss(line);
            std::string cmd, key, value;
            iss >> cmd >> key;
            if (cmd == "SET") {
                iss >> value;
                db->set(key, value);
            } else if (cmd == "DEL") {
                db->del(key);
            }
        }
    }
};

std::mutex db_mutex;

// Enhanced DB implementation
EnhancedDB::EnhancedDB(size_t capacity) : cache_(new EnhancedCache(capacity)) {}

void EnhancedDB::set(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    storage_[key] = DataValue(value);
    cache_->put(key, storage_[key]);
    AOFLogger::log("SET " + key + " " + value);
}

bool EnhancedDB::get(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    DataValue data_value;
    if (cache_->get(key, data_value)) {
        if (data_value.type == DataType::STRING) {
            value = std::get<std::string>(data_value.data);
            return true;
        }
    }
    return false;
}

bool EnhancedDB::incr(const std::string& key, int64_t& result) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::incr(storage_, key, result);
    if (success) {
        sync_to_cache(key);
        AOFLogger::log("INCR " + key);
    }
    return success;
}

bool EnhancedDB::decr(const std::string& key, int64_t& result) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::decr(storage_, key, result);
    if (success) {
        sync_to_cache(key);
        AOFLogger::log("DECR " + key);
    }
    return success;
}

bool EnhancedDB::lpush(const std::string& key, const std::vector<std::string>& values) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::lpush(storage_, key, values);
    if (success) {
        sync_to_cache(key);
        std::string vals;
        for (const auto& v : values) vals += " " + v;
        AOFLogger::log("LPUSH " + key + vals);
    }
    return success;
}

bool EnhancedDB::rpush(const std::string& key, const std::vector<std::string>& values) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::rpush(storage_, key, values);
    if (success) {
        sync_to_cache(key);
        std::string vals;
        for (const auto& v : values) vals += " " + v;
        AOFLogger::log("RPUSH " + key + vals);
    }
    return success;
}

bool EnhancedDB::lpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::lpop(storage_, key, value);
    if (success) {
        sync_to_cache(key);
        AOFLogger::log("LPOP " + key);
    }
    return success;
}

bool EnhancedDB::rpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::rpop(storage_, key, value);
    if (success) {
        sync_to_cache(key);
        AOFLogger::log("RPOP " + key);
    }
    return success;
}

bool EnhancedDB::llen(const std::string& key, size_t& length) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::llen(storage_, key, length);
}

bool EnhancedDB::lrange(const std::string& key, int start, int stop, std::vector<std::string>& result) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::lrange(storage_, key, start, stop, result);
}

bool EnhancedDB::sadd(const std::string& key, const std::vector<std::string>& members) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::sadd(storage_, key, members);
    if (success) {
        sync_to_cache(key);
        std::string mems;
        for (const auto& m : members) mems += " " + m;
        AOFLogger::log("SADD " + key + mems);
    }
    return success;
}

bool EnhancedDB::srem(const std::string& key, const std::vector<std::string>& members) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::srem(storage_, key, members);
    if (success) {
        sync_to_cache(key);
        std::string mems;
        for (const auto& m : members) mems += " " + m;
        AOFLogger::log("SREM " + key + mems);
    }
    return success;
}

bool EnhancedDB::smembers(const std::string& key, std::set<std::string>& members) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::smembers(storage_, key, members);
}

bool EnhancedDB::scard(const std::string& key, size_t& count) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::scard(storage_, key, count);
}

bool EnhancedDB::sismember(const std::string& key, const std::string& member) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::sismember(storage_, key, member);
}

bool EnhancedDB::hset(const std::string& key, const std::string& field, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::hset(storage_, key, field, value);
    if (success) {
        sync_to_cache(key);
        AOFLogger::log("HSET " + key + " " + field + " " + value);
    }
    return success;
}

bool EnhancedDB::hget(const std::string& key, const std::string& field, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::hget(storage_, key, field, value);
}

bool EnhancedDB::hdel(const std::string& key, const std::vector<std::string>& fields) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    bool success = DataOperations::hdel(storage_, key, fields);
    if (success) {
        sync_to_cache(key);
        std::string flds;
        for (const auto& f : fields) flds += " " + f;
        AOFLogger::log("HDEL " + key + flds);
    }
    return success;
}

bool EnhancedDB::hgetall(const std::string& key, std::unordered_map<std::string, std::string>& result) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::hgetall(storage_, key, result);
}

bool EnhancedDB::hkeys(const std::string& key, std::vector<std::string>& fields) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::hkeys(storage_, key, fields);
}

bool EnhancedDB::hvals(const std::string& key, std::vector<std::string>& values) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::hvals(storage_, key, values);
}

void EnhancedDB::del(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->erase(key);
    storage_.erase(key);
    AOFLogger::log("DEL " + key);
}

bool EnhancedDB::exists(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    return cache_->exists(key) || storage_.find(key) != storage_.end();
}

DataType EnhancedDB::type(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::type(storage_, key);
}

std::vector<std::string> EnhancedDB::keys(const std::string& pattern) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return DataOperations::keys(storage_, pattern);
}

void EnhancedDB::save(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    nlohmann::json j;
    for (const auto& item : storage_) {
        j[item.first] = item.second.to_json();
    }
    std::ofstream file(filename);
    file << j.dump();
}

void EnhancedDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename);
    if (!file.is_open()) return;
    
    nlohmann::json j;
    file >> j;
    
    storage_.clear();
    cache_->clear();
    
    for (auto it = j.begin(); it != j.end(); ++it) {
        DataValue value = DataValue::from_json(it.value());
        storage_[it.key()] = value;
        cache_->put(it.key(), value);
    }
}

void EnhancedDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}

void EnhancedDB::flushdb() {
    std::lock_guard<std::mutex> lock(db_mutex);
    storage_.clear();
    cache_->clear();
    AOFLogger::log("FLUSHDB");
}

size_t EnhancedDB::dbsize() {
    std::lock_guard<std::mutex> lock(db_mutex);
    sync_from_cache();
    return storage_.size();
}

size_t EnhancedDB::get_hits() const {
    return cache_->get_hits();
}

size_t EnhancedDB::get_misses() const {
    return cache_->get_misses();
}

void EnhancedDB::sync_to_cache(const std::string& key) {
    auto it = storage_.find(key);
    if (it != storage_.end()) {
        cache_->put(key, it->second);
    }
}

void EnhancedDB::sync_from_cache() {
    // For now, we keep storage_ as the primary source
    // In a more sophisticated implementation, we could sync cache data back to storage
}

EnhancedDB::~EnhancedDB() {
    delete cache_;
}

// LRUDB method implementations (unchanged)
LRUDB::LRUDB(size_t capacity) : cache_(new LRUCache(capacity)) {
    AOFLogger::replay(this);
}
void LRUDB::set(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->put(key, value);
    AOFLogger::log("SET " + key + " " + value);
}
bool LRUDB::get(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    return cache_->get(key, value);
}
void LRUDB::del(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->erase(key);
    AOFLogger::log("DEL " + key);
}
void LRUDB::save(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    nlohmann::json j;
    for (const auto& item : cache_->get_items()) {
        j[item.first] = item.second;
    }
    std::ofstream file(filename);
    file << j.dump();
}
void LRUDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename);
    nlohmann::json j;
    file >> j;
    for (auto it = j.begin(); it != j.end(); ++it) {
        cache_->put(it.key(), it.value());
    }
}
void LRUDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}

// LFUDB method implementations
LFUDB::LFUDB(size_t capacity) : cache_(new LFUCache(capacity)) {}
void LFUDB::set(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->put(key, value);
}
bool LFUDB::get(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    return cache_->get(key, value);
}
void LFUDB::del(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->erase(key);
}
void LFUDB::save(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    nlohmann::json j;
    for (const auto& item : cache_->get_items()) {
        j[item.first] = item.second;
    }
    std::ofstream file(filename);
    file << j.dump();
}
void LFUDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename);
    nlohmann::json j;
    file >> j;
    for (auto it = j.begin(); it != j.end(); ++it) {
        cache_->put(it.key(), it.value());
    }
}
void LFUDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}
LFUDB::~LFUDB() { delete cache_; }

// Factory function
DB* create_db(const std::string& policy, size_t capacity) {
    if (policy == "ENHANCED") return new EnhancedDB(capacity);
    if (policy == "LFU") return new LFUDB(capacity);
    return new LRUDB(capacity);
}
