/*
 * arc_cache.cpp
 * Implements the ARCCache class for the Adaptive Replacement Cache (ARC) policy.
 */

#include "arc_cache.h"
#include <algorithm>
#include <chrono> // For std::chrono::high_resolution_clock

ARCCache::ARCCache(size_t size) : size_(size), p_(0), hits_(0), misses_(0) {}

void ARCCache::put(const std::string& key, const std::string& value) {
    // Case I: item is in T1 or T2 (cache hit)
    if (t1_map_.count(key)) {
        hits_++;
        auto start_time = std::chrono::high_resolution_clock::now();
        t1_.erase(t1_map_[key]);
        t1_map_.erase(key);
        t2_.push_front({key, value});
        t2_map_[key] = t2_.begin();
        auto end_time = std::chrono::high_resolution_clock::now();
        total_hit_latency_ms_ += std::chrono::duration<double, std::milli>(end_time - start_time).count();
        return;
    }
    if (t2_map_.count(key)) {
        hits_++;
        auto start_time = std::chrono::high_resolution_clock::now();
        t2_.erase(t2_map_[key]);
        t2_map_.erase(key);
        t2_.push_front({key, value});
        t2_map_[key] = t2_.begin();
        auto end_time = std::chrono::high_resolution_clock::now();
        total_hit_latency_ms_ += std::chrono::duration<double, std::milli>(end_time - start_time).count();
        return;
    }

    // Case II: item is in B1 or B2 (cache miss, but in ghost list)
    if (b1_map_.count(key)) {
        misses_++;
        p_ = std::min(size_, p_ + std::max((size_t)1, b2_.size() / b1_.size()));
        replace(key, value);
        b1_.erase(b1_map_[key]);
        b1_map_.erase(key);
        t2_.push_front({key, value});
        t2_map_[key] = t2_.begin();
        return;
    }
    if (b2_map_.count(key)) {
        misses_++;
        p_ = std::max((size_t)0, p_ - std::max((size_t)1, b1_.size() / b2_.size()));
        replace(key, value);
        b2_.erase(b2_map_[key]);
        b2_map_.erase(key);
        t2_.push_front({key, value});
        t2_map_[key] = t2_.begin();
        return;
    }

    // Case III: item is new (cache miss, not in ghost list)
    misses_++;
    if (t1_.size() + b1_.size() == size_) {
        if (t1_.size() < size_) {
            // ARC-TERP 1
            std::string evicted_key = b1_.back().key;
            b1_.erase(b1_map_[evicted_key]);
            b1_map_.erase(evicted_key);
            replace(key, value);
        } else {
            // ARC-TERP 2
            std::string evicted_key = t1_.back().key;
            t1_.pop_back();
            t1_map_.erase(evicted_key);
            eviction_count_++; // Eviction from T1
        }
    } else if (t1_.size() + t2_.size() == size_) {
        if (t1_.size() + b1_.size() == 2 * size_) {
            std::string evicted_key = b1_.back().key;
            b1_.pop_back();
            b1_map_.erase(evicted_key);
        }
        replace(key, value);
    }

    t1_.push_front({key, value});
    t1_map_[key] = t1_.begin();

    // Eviction if total cache size exceeds limit (L1 + L2 > C)
    if (t1_.size() + t2_.size() > size_) {
        if (t1_.size() > p_) {
            std::string evicted_key = t1_.back().key;
            t1_.pop_back();
            t1_map_.erase(evicted_key);
            b1_.push_front({evicted_key, ""}); // Value not needed for ghost list
            b1_map_[evicted_key] = b1_.begin();
            eviction_count_++; // Eviction from T1 to B1
        } else {
            std::string evicted_key = t2_.back().key;
            t2_.pop_back();
            t2_map_.erase(evicted_key);
            b2_.push_front({evicted_key, ""});
            b2_map_[evicted_key] = b2_.begin();
            eviction_count_++; // Eviction from T2 to B2
        }
    }
}

bool ARCCache::get(const std::string& key, std::string& value) {
    auto start_time = std::chrono::high_resolution_clock::now(); // Start timing
    if (t1_map_.count(key)) {
        hits_++;
        value = t1_map_[key]->value;
        t2_.push_front(*t1_map_[key]);
        t2_map_[key] = t2_.begin();
        t1_.erase(t1_map_[key]);
        t1_map_.erase(key);
        auto end_time = std::chrono::high_resolution_clock::now(); // End timing
        total_hit_latency_ms_ += std::chrono::duration<double, std::milli>(end_time - start_time).count(); // Accumulate latency
        return true;
    }
    if (t2_map_.count(key)) {
        hits_++;
        value = t2_map_[key]->value;
        t2_.erase(t2_map_[key]);
        t2_map_.erase(key);
        t2_.push_front({key, value});
        t2_map_[key] = t2_.begin();
        auto end_time = std::chrono::high_resolution_clock::now(); // End timing
        total_hit_latency_ms_ += std::chrono::duration<double, std::milli>(end_time - start_time).count(); // Accumulate latency
        return true;
    }
    misses_++; // Count miss if not found in T1 or T2
    return false;
}

void ARCCache::replace(const std::string& key, const std::string& value) {
    // If cache is full, decide which list to evict from
    if (t1_.size() > p_) { // If T1 is larger than P, evict from T1
        std::string evicted_key = t1_.back().key;
        t1_.pop_back();
        t1_map_.erase(evicted_key);
        b1_.push_front({evicted_key, ""});
        b1_map_[evicted_key] = b1_.begin();
        eviction_count_++; // Eviction from T1 to B1 via replace
    } else { // If T1 is not larger than P, evict from T2
        std::string evicted_key = t2_.back().key;
        t2_.pop_back();
        t2_map_.erase(evicted_key);
        b2_.push_front({evicted_key, ""});
        b2_map_[evicted_key] = b2_.begin();
        eviction_count_++; // Eviction from T2 to B2 via replace
    }
}

void ARCCache::move_to_t2(const std::string& key) {
    // This method is primarily used internally by 'replace' and 'put' logic
    // When an item moves from T1 to T2 or from B1/B2 to T2, it should be handled there.
    // No direct external call to this method expected for simple ARC implementation.
}

void ARCCache::erase(const std::string& key) {
    if (t1_map_.count(key)) {
        t1_.erase(t1_map_[key]);
        t1_map_.erase(key);
    } else if (t2_map_.count(key)) {
        t2_.erase(t2_map_[key]);
        t2_map_.erase(key);
    } else if (b1_map_.count(key)) {
        b1_.erase(b1_map_[key]);
        b1_map_.erase(key);
    } else if (b2_map_.count(key)) {
        b2_.erase(b2_map_[key]);
        b2_map_.erase(key);
    }
}

void ARCCache::set_expiry(const std::string& key, int seconds) {
    // ARC cache itself does not handle expiry. This should be handled at the DB layer.
    // For now, this method does nothing, consistent with LRU/LFU cache definitions.
}

std::unordered_map<std::string, std::string> ARCCache::get_items() const {
    std::unordered_map<std::string, std::string> items;
    for (const auto& entry : t1_) {
        items[entry.key] = entry.value;
    }
    for (const auto& entry : t2_) {
        items[entry.key] = entry.value;
    }
    return items;
} 