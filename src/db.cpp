#include "db.h"
#include "lru_cache.h"
#include "lfu_cache.h"
#include <fstream>
#include <json.hpp>
#include <mutex>
#include <string>
#include <sstream>
#include "plusaes.hpp"

static const char* AOF_FILENAME = "db.aof";

// Encryption/decryption functions
static const std::string ENCRYPTION_KEY = "aVeryStrongEncryptionKeyForMyDB12345"; // 32-byte key for AES-256

std::string encrypt_data(const std::string& plaintext, const std::string& key) {
    std::vector<unsigned char> encrypted(plusaes::get_padded_encrypted_size(plaintext.size()));
    plusaes::encrypt_ecb((unsigned char*)plaintext.data(), plaintext.size(), (unsigned char*)key.data(), key.size(), &encrypted[0], encrypted.size(), true);
    return std::string(encrypted.begin(), encrypted.end());
}

std::string decrypt_data(const std::string& ciphertext, const std::string& key) {
    std::vector<unsigned char> decrypted(ciphertext.size());
    unsigned long padded_size = 0;
    plusaes::decrypt_ecb((unsigned char*)ciphertext.data(), ciphertext.size(), (unsigned char*)key.data(), key.size(), &decrypted[0], decrypted.size(), &padded_size);
    return std::string(decrypted.begin(), decrypted.begin() + padded_size);
}

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

// LRUDB method implementations
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
    std::string json_str = j.dump();
    std::string encrypted_data = encrypt_data(json_str, ENCRYPTION_KEY);
    std::ofstream file(filename, std::ios::binary);
    file << encrypted_data;
}
void LRUDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename, std::ios::binary);
    if (file) {
        std::string encrypted_data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        std::string decrypted_data = decrypt_data(encrypted_data, ENCRYPTION_KEY);
        nlohmann::json j = nlohmann::json::parse(decrypted_data);
        for (auto it = j.begin(); it != j.end(); ++it) {
            cache_->put(it.key(), it.value().get<std::string>());
        }
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
    if (policy == "LFU") return new LFUDB(capacity);
    return new LRUDB(capacity);
}
