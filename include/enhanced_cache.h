#pragma once
#include "data_types.h"
#include <unordered_map>
#include <list>
#include <string>
#include <chrono>

class EnhancedCache {
public:
    EnhancedCache(size_t capacity);
    
    // Core cache operations
    void put(const std::string& key, const DataValue& value);
    bool get(const std::string& key, DataValue& value);
    void erase(const std::string& key);
    bool exists(const std::string& key) const;
    
    // TTL support
    void set_expiry(const std::string& key, int seconds);
    
    // Stats
    size_t get_hits() const { return hits_; }
    size_t get_misses() const { return misses_; }
    size_t size() const { return data_.size(); }
    
    // Data access for persistence
    const std::unordered_map<std::string, DataValue>& get_data() const { return data_; }
    void clear() { data_.clear(); lru_list_.clear(); lru_map_.clear(); expiry_.clear(); }

private:
    void touch(const std::string& key);
    void cleanup_expired();
    void evict_if_needed();
    
    size_t capacity_;
    std::unordered_map<std::string, DataValue> data_;
    
    // LRU tracking
    std::list<std::string> lru_list_;
    std::unordered_map<std::string, std::list<std::string>::iterator> lru_map_;
    
    // TTL support
    std::unordered_map<std::string, std::chrono::steady_clock::time_point> expiry_;
    
    // Stats
    size_t hits_ = 0;
    size_t misses_ = 0;
};
