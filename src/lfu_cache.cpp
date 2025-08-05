#include "lfu_cache.h"
#include <algorithm>

LFUCache::LFUCache(size_t capacity) : capacity_(capacity) {}

void LFUCache::put(const std::string& key, const std::string& value) {
    auto it = map_.find(key);
    if (it != map_.end()) {
        items_.erase(it->second);
        map_.erase(it);
        expiry_.erase(key);
        freq_list_[freq_[key]].remove(key);
        freq_.erase(key);
    }
    items_.push_front({key, value});
    map_[key] = items_.begin();
    freq_[key] = 1;
    freq_list_[1].push_back(key);
    if (map_.size() > capacity_) {
        int min_freq = freq_list_.begin()->first;
        std::string evict_key = freq_list_[min_freq].front();
        freq_list_[min_freq].pop_front();
        erase(evict_key);
    }
}

bool LFUCache::get(const std::string& key, std::string& value) {
    auto it = map_.find(key);
    if (it == map_.end()) { misses_++; return false; }
    auto eit = expiry_.find(key);
    if (eit != expiry_.end() && std::chrono::steady_clock::now() > eit->second) {
        erase(key);
        expiry_.erase(key);
        misses_++;
        return false;
    }
    update_freq(key);
    value = it->second->second;
    hits_++;
    return true;
}

void LFUCache::erase(const std::string& key) {
    auto it = map_.find(key);
    if (it != map_.end()) {
        items_.erase(it->second);
        map_.erase(it);
        expiry_.erase(key);
        int f = freq_[key];
        freq_list_[f].remove(key);
        if (freq_list_[f].empty()) freq_list_.erase(f);
        freq_.erase(key);
    }
}

void LFUCache::set_expiry(const std::string& key, int seconds) {
    expiry_[key] = std::chrono::steady_clock::now() + std::chrono::seconds(seconds);
}

void LFUCache::update_freq(const std::string& key) {
    int f = freq_[key];
    freq_list_[f].remove(key);
    if (freq_list_[f].empty()) freq_list_.erase(f);
    freq_[key] = f + 1;
    freq_list_[f + 1].push_back(key);
}
