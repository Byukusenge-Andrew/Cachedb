#pragma once
#include <string>
#include "lru_cache.h"
#include "lfu_cache.h"
#include "plusaes.hpp"
#include <mutex>
#include <json.hpp>
#include <unordered_map>
#include <list>
#include <chrono>
#include "cluster.h"
#include "hyperloglog.h"
#include "arc_cache.h"

class DB {
public:
    virtual void set(const std::string& key, const std::string& value) = 0;
    // Return true if found, false otherwise; value is set if found
    virtual bool get(const std::string& key, std::string& value) = 0;
    virtual void del(const std::string& key) = 0;
    virtual void save(const std::string& filename) = 0;
    virtual void load(const std::string& filename) = 0;
    virtual void expire(const std::string& key, int seconds) = 0;
    // New list operations
    virtual void lpush(const std::string& key, const std::string& value) = 0;
    virtual void rpush(const std::string& key, const std::string& value) = 0;
    virtual bool lpop(const std::string& key, std::string& value) = 0;
    virtual bool rpop(const std::string& key, std::string& value) = 0;
    virtual size_t llen(const std::string& key) = 0;
    // HyperLogLog operations
    virtual void hll_add(const std::string& key, const std::string& element) = 0;
    virtual long long hll_count(const std::string& key) = 0;
    virtual ~DB() = default;

protected:
    std::unordered_map<std::string, std::list<std::string>> lists_;
    std::unordered_map<std::string, HyperLogLog> hlls_; // New: To store HyperLogLog instances
};

class LRUDB : public DB {
public:
    LRUDB(size_t capacity);
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    void del(const std::string& key) override;
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void lpush(const std::string& key, const std::string& value) override;
    void rpush(const std::string& key, const std::string& value) override;
    bool lpop(const std::string& key, std::string& value) override;
    bool rpop(const std::string& key, std::string& value) override;
    size_t llen(const std::string& key) override;
    void hll_add(const std::string& key, const std::string& element) override;
    long long hll_count(const std::string& key) override;
    ~LRUDB() override = default;
    LRUCache* cache_;
};

class LFUDB : public DB {
public:
    LFUDB(size_t capacity);
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    void del(const std::string& key) override;
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void lpush(const std::string& key, const std::string& value) override;
    void rpush(const std::string& key, const std::string& value) override;
    bool lpop(const std::string& key, std::string& value) override;
    bool rpop(const std::string& key, std::string& value) override;
    size_t llen(const std::string& key) override;
    void hll_add(const std::string& key, const std::string& element) override;
    long long hll_count(const std::string& key) override;
    ~LFUDB() override;
    LFUCache* cache_;
};

class ARCDB : public DB {
public:
    ARCDB(size_t capacity);
    void set(const std::string& key, const std::string& value) override;
    bool get(const std::string& key, std::string& value) override;
    void del(const std::string& key) override;
    void save(const std::string& filename) override;
    void load(const std::string& filename) override;
    void expire(const std::string& key, int seconds) override;
    void lpush(const std::string& key, const std::string& value) override;
    void rpush(const std::string& key, const std::string& value) override;
    bool lpop(const std::string& key, std::string& value) override;
    bool rpop(const std::string& key, std::string& value) override;
    size_t llen(const std::string& key) override;
    void hll_add(const std::string& key, const std::string& element) override;
    long long hll_count(const std::string& key) override;
    ~ARCDB() override;
    ARCCache* cache_;
};

// Factory function for DB
DB* create_db(const std::string& policy, size_t capacity);

// Encryption/decryption functions
std::string encrypt_data(const std::string& plaintext, const std::string& key);
std::string decrypt_data(const std::string& ciphertext, const std::string& key);
