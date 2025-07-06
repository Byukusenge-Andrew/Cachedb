#include "lru_cache.h"
#include <chrono>

LRUCache::LRUCache(size_t capacity) : capacity_(capacity) {}

void LRUCache::put(const std::string& key, const std::string& value) {
    auto it = map_.find(key);
    if (it != map_.end()) {
        items_.erase(it->second);
        map_.erase(it);
        expiry_.erase(key);
    }
    items_.push_front({key, value});
    map_[key] = items_.begin();
    if (map_.size() > capacity_) {
        auto last = items_.end();
        --last;
        expiry_.erase(last->first);
        map_.erase(last->first);
        items_.pop_back();
        eviction_count_++;
    }
}

bool LRUCache::get(const std::string& key, std::string& value) {
    auto start_time = std::chrono::high_resolution_clock::now();
    auto it = map_.find(key);
    if (it == map_.end()) { misses_++; return false; }
    // TTL check
    auto eit = expiry_.find(key);
    if (eit != expiry_.end() && std::chrono::steady_clock::now() > eit->second) {
        erase(key);
        expiry_.erase(key);
        misses_++;
        eviction_count_++;
        return false;
    }
    items_.splice(items_.begin(), items_, it->second);
    value = it->second->second;
    hits_++;
    auto end_time = std::chrono::high_resolution_clock::now();
    total_hit_latency_ms_ += std::chrono::duration<double, std::milli>(end_time - start_time).count();
    return true;
}

void LRUCache::erase(const std::string& key) {
    auto it = map_.find(key);
    if (it != map_.end()) {
        items_.erase(it->second);
        map_.erase(it);
        expiry_.erase(key);
    }
}

void LRUCache::set_expiry(const std::string& key, int seconds) {
    expiry_[key] = std::chrono::steady_clock::now() + std::chrono::seconds(seconds);
}
