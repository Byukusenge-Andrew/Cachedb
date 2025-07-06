/*
 * arc_cache.h
 * Defines the ARCCache class for the Adaptive Replacement Cache (ARC) policy.
 */

#ifndef ARC_CACHE_H
#define ARC_CACHE_H

#include <string>
#include <unordered_map>
#include <list>
#include <cstddef>

class ARCCache {
private:
    struct Entry { std::string key, value; };
    std::list<Entry> t1_, t2_, b1_, b2_; // ARC lists: recent, frequent, ghost lists
    std::unordered_map<std::string, std::list<Entry>::iterator> t1_map_, t2_map_;
    std::unordered_map<std::string, std::list<Entry>::iterator> b1_map_, b2_map_;
    size_t p_, size_;
    size_t hits_, misses_;
    double total_hit_latency_ms_ = 0.0; // New: to track total latency for hits
    size_t eviction_count_ = 0;        // New: to track evictions

    void replace(const std::string& key, const std::string& value);
    void move_to_t2(const std::string& key);

public:
    ARCCache(size_t size);
    void put(const std::string& key, const std::string& value);
    bool get(const std::string& key, std::string& value);
    size_t get_hits() const { return hits_; }
    size_t get_misses() const { return misses_; }
    double get_avg_hit_latency() const { return total_hit_latency_ms_ / (hits_ > 0 ? hits_ : 1); }
    size_t get_eviction_count() const { return eviction_count_; }
    void erase(const std::string& key);
    void set_expiry(const std::string& key, int seconds);
    std::unordered_map<std::string, std::string> get_items() const; // For saving cache content
};

#endif // ARC_CACHE_H 