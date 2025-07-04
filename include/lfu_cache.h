#pragma once
#include <unordered_map>
#include <map>
#include <string>
#include <list>
#include <chrono>

class LFUCache {
public:
    LFUCache(size_t capacity);
    void put(const std::string& key, const std::string& value);
    bool get(const std::string& key, std::string& value);
    void erase(const std::string& key);
    const std::list<std::pair<std::string, std::string>>& get_items() const { return items_; }
    void set_expiry(const std::string& key, int seconds);
    size_t get_hits() const { return hits_; }
    size_t get_misses() const { return misses_; }
private:
    size_t capacity_;
    std::list<std::pair<std::string, std::string>> items_;
    std::unordered_map<std::string, std::list<std::pair<std::string, std::string>>::iterator> map_;
    std::unordered_map<std::string, int> freq_;
    std::map<int, std::list<std::string>> freq_list_;
    std::unordered_map<std::string, std::chrono::steady_clock::time_point> expiry_;
    size_t hits_ = 0;
    size_t misses_ = 0;
    void update_freq(const std::string& key);
};
