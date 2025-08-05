#include "enhanced_cache.h"
#include <algorithm>

EnhancedCache::EnhancedCache(size_t capacity) : capacity_(capacity) {}

void EnhancedCache::put(const std::string& key, const DataValue& value) {
    cleanup_expired();
    
    auto it = data_.find(key);
    if (it != data_.end()) {
        // Update existing key
        it->second = value;
        touch(key);
    } else {
        // Insert new key
        data_[key] = value;
        lru_list_.push_front(key);
        lru_map_[key] = lru_list_.begin();
        evict_if_needed();
    }
}

bool EnhancedCache::get(const std::string& key, DataValue& value) {
    cleanup_expired();
    
    auto it = data_.find(key);
    if (it != data_.end()) {
        // Check if expired
        auto exp_it = expiry_.find(key);
        if (exp_it != expiry_.end() && std::chrono::steady_clock::now() > exp_it->second) {
            erase(key);
            misses_++;
            return false;
        }
        
        value = it->second;
        touch(key);
        hits_++;
        return true;
    }
    
    misses_++;
    return false;
}

void EnhancedCache::erase(const std::string& key) {
    auto it = data_.find(key);
    if (it != data_.end()) {
        data_.erase(it);
        
        auto lru_it = lru_map_.find(key);
        if (lru_it != lru_map_.end()) {
            lru_list_.erase(lru_it->second);
            lru_map_.erase(lru_it);
        }
        
        expiry_.erase(key);
    }
}

bool EnhancedCache::exists(const std::string& key) const {
    auto it = data_.find(key);
    if (it == data_.end()) return false;
    
    // Check if expired
    auto exp_it = expiry_.find(key);
    if (exp_it != expiry_.end() && std::chrono::steady_clock::now() > exp_it->second) {
        return false;
    }
    
    return true;
}

void EnhancedCache::set_expiry(const std::string& key, int seconds) {
    if (data_.find(key) != data_.end()) {
        expiry_[key] = std::chrono::steady_clock::now() + std::chrono::seconds(seconds);
    }
}

void EnhancedCache::touch(const std::string& key) {
    auto lru_it = lru_map_.find(key);
    if (lru_it != lru_map_.end()) {
        lru_list_.erase(lru_it->second);
        lru_list_.push_front(key);
        lru_map_[key] = lru_list_.begin();
    }
}

void EnhancedCache::cleanup_expired() {
    auto now = std::chrono::steady_clock::now();
    auto it = expiry_.begin();
    while (it != expiry_.end()) {
        if (now > it->second) {
            erase(it->first);
            it = expiry_.erase(it);
        } else {
            ++it;
        }
    }
}

void EnhancedCache::evict_if_needed() {
    while (data_.size() > capacity_) {
        if (!lru_list_.empty()) {
            std::string lru_key = lru_list_.back();
            erase(lru_key);
        } else {
            break;
        }
    }
}
