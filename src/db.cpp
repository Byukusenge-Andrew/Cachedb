#include "db.h"
#include "lru_cache.h"
#include "lfu_cache.h"
#include <fstream>
#include <json.hpp>
#include <mutex>
#include <string>
#include <sstream>
#include "plusaes.hpp"
#include "arc_cache.h"
#include <chrono> // For std::chrono
#include <iomanip> // For std::put_time

static const char* AOF_FILENAME = "db.aof";

// Encryption/decryption functions
// static const std::string ENCRYPTION_KEY = "aVeryStrongEncryptionKeyForMyDB12345"; // 32-byte key for AES-256

std::string get_encryption_key() {
    const char* key = std::getenv("MYDB_ENCRYPTION_KEY");
    return key ? key : "default_secure_key_32_bytes_long_12345678"; // Default 32-byte key
}

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
    static void replay(DB* db) {
        std::ifstream aof(AOF_FILENAME);
        std::string line;
        while (std::getline(aof, line)) {
            std::istringstream iss(line);
            std::string cmd, key, value;
            iss >> cmd >> key;
            if (cmd == "SET") {
                // Replay SET commands, handling potential spaces/quotes properly if present in AOF
                std::getline(iss >> std::ws, value); 
                db->set(key, value);
            } else if (cmd == "DEL") {
                db->del(key);
            }
            // Note: EXPIRE commands from AOF are currently not replayed. 
            // This might lead to discrepancies if not addressed in AOF design.
        }
    }
    static void clear() {
        std::ofstream aof(AOF_FILENAME, std::ios::trunc); // Open in truncate mode to clear the file
        // File is cleared upon opening with std::ios::trunc, no need to write anything.
    }
};

std::mutex db_mutex;

// LRUDB method implementations
LRUDB::LRUDB(size_t capacity) : cache_(new LRUCache(capacity)) {
    AOFLogger::replay(this);
    AOFLogger::clear(); // Clear AOF after replaying on startup
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
    
    // Save string data
    for (const auto& item : cache_->get_items()) {
        j["data"][item.first] = encrypt_data(item.second, get_encryption_key());
    }
    
    // Save list data
    for (const auto& [key, list] : lists_) {
        j["lists"][key] = list;
    }
    
    // Save HLL data
    for (const auto& [key, hll] : hlls_) {
        std::vector<int> registers_int(hll.get_registers().begin(), hll.get_registers().end());
        nlohmann::json hll_registers_json = registers_int;
        j["hlls"][key] = hll_registers_json;
    }
    
    std::string json_str = j.dump();
    std::string encrypted_data = encrypt_data(json_str, get_encryption_key());
    
    // Save to main file
    std::ofstream file(filename, std::ios::binary);
    file << encrypted_data;

    // Create incremental backup
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << filename << ".backup_" << std::put_time(std::localtime(&in_time_t), "%Y%m%d_%H%M%S");
    std::ofstream backup_file(ss.str(), std::ios::binary);
    backup_file << encrypted_data;
}
void LRUDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename, std::ios::binary);
    if (file) {
        std::string encrypted_data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        std::string decrypted_data = decrypt_data(encrypted_data, get_encryption_key());
        nlohmann::json j = nlohmann::json::parse(decrypted_data);
        
        // Load string data
        if (j.contains("data")) {
            for (auto it = j["data"].begin(); it != j["data"].end(); ++it) {
                cache_->put(it.key(), decrypt_data(it.value().get<std::string>(), get_encryption_key()));
            }
        }
        
        // Load list data
        if (j.contains("lists")) {
            for (auto it = j["lists"].begin(); it != j["lists"].end(); ++it) {
                for (const auto& item : it.value()) {
                    lists_[it.key()].push_back(item.get<std::string>());
                }
            }
        }

        // Load HLL data
        if (j.contains("hlls")) {
            for (auto it = j["hlls"].begin(); it != j["hlls"].end(); ++it) {
                std::string key = it.key();
                nlohmann::json hll_registers_json = it.value();
                unsigned int precision = 16; // Default precision, assuming it's consistent
                if (hll_registers_json.is_array() && !hll_registers_json.empty()) {
                    HyperLogLog hll(precision);
                    std::vector<unsigned char> loaded_registers;
                    for (const auto& reg_val : hll_registers_json) {
                        loaded_registers.push_back(reg_val.get<unsigned char>());
                    }
                    hll.set_registers(loaded_registers);
                    hlls_[key] = hll;
                }
            }
        }
    }
}
void LRUDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}
void LRUDB::lpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_front(value);
    // No cache interaction here for lists, as they are a separate data type
    // If you want cache to track list keys, consider adding them to the cache with a dummy value.
}
void LRUDB::rpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_back(value);
}
bool LRUDB::lpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.front();
        it->second.pop_front();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}
bool LRUDB::rpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.back();
        it->second.pop_back();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}
size_t LRUDB::llen(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    return it != lists_.end() ? it->second.size() : 0;
}

void LRUDB::hll_add(const std::string& key, const std::string& element) {
    std::lock_guard<std::mutex> lock(db_mutex);
    hlls_[key].add(element);
    AOFLogger::log("HLL.ADD " + key + " " + element);
}

long long LRUDB::hll_count(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = hlls_.find(key);
    if (it != hlls_.end()) {
        return it->second.count();
    }
    return 0;
}

// LFUDB method implementations
LFUDB::LFUDB(size_t capacity) : cache_(new LFUCache(capacity)) {
    AOFLogger::replay(this);
    AOFLogger::clear(); // Clear AOF after replaying on startup
}
void LFUDB::set(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->put(key, value);
    AOFLogger::log("SET " + key + " " + value);
}
bool LFUDB::get(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    return cache_->get(key, value);
}
void LFUDB::del(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->erase(key);
    AOFLogger::log("DEL " + key);
}
void LFUDB::save(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    nlohmann::json j;
    
    // Save string data
    for (const auto& item : cache_->get_items()) {
        j["data"][item.first] = encrypt_data(item.second, get_encryption_key());
    }
    
    // Save list data
    for (const auto& [key, list] : lists_) {
        j["lists"][key] = list;
    }

    // Save HLL data
    for (const auto& [key, hll] : hlls_) {
        std::vector<int> registers_int(hll.get_registers().begin(), hll.get_registers().end());
        nlohmann::json hll_registers_json = registers_int;
        j["hlls"][key] = hll_registers_json;
    }
    
    std::string json_str = j.dump();
    std::string encrypted_data = encrypt_data(json_str, get_encryption_key());
    
    // Save to main file
    std::ofstream file(filename, std::ios::binary);
    file << encrypted_data;

    // Create incremental backup
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << filename << ".backup_" << std::put_time(std::localtime(&in_time_t), "%Y%m%d_%H%M%S");
    std::ofstream backup_file(ss.str(), std::ios::binary);
    backup_file << encrypted_data;
}
void LFUDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename, std::ios::binary);
    if (file) {
        std::string encrypted_data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        std::string decrypted_data = decrypt_data(encrypted_data, get_encryption_key());
        nlohmann::json j = nlohmann::json::parse(decrypted_data);

        // Load string data
        if (j.contains("data")) {
            for (auto it = j["data"].begin(); it != j["data"].end(); ++it) {
                cache_->put(it.key(), decrypt_data(it.value().get<std::string>(), get_encryption_key()));
            }
        }

        // Load list data
        if (j.contains("lists")) {
            for (auto it = j["lists"].begin(); it != j["lists"].end(); ++it) {
                for (const auto& item : it.value()) {
                    lists_[it.key()].push_back(item.get<std::string>());
                }
            }
        }

        // Load HLL data
        if (j.contains("hlls")) {
            for (auto it = j["hlls"].begin(); it != j["hlls"].end(); ++it) {
                std::string key = it.key();
                nlohmann::json hll_registers_json = it.value();
                unsigned int precision = 16; // Default precision, assuming it's consistent
                if (hll_registers_json.is_array() && !hll_registers_json.empty()) {
                    HyperLogLog hll(precision);
                    std::vector<unsigned char> loaded_registers;
                    for (const auto& reg_val : hll_registers_json) {
                        loaded_registers.push_back(reg_val.get<unsigned char>());
                    }
                    hll.set_registers(loaded_registers);
                    hlls_[key] = hll;
                }
            }
        }
    }
}
void LFUDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}
LFUDB::~LFUDB() { delete cache_; }

void LFUDB::hll_add(const std::string& key, const std::string& element) {
    std::lock_guard<std::mutex> lock(db_mutex);
    hlls_[key].add(element);
    AOFLogger::log("HLL.ADD " + key + " " + element);
}

long long LFUDB::hll_count(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = hlls_.find(key);
    if (it != hlls_.end()) {
        return it->second.count();
    }
    return 0;
}

void LFUDB::lpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_front(value);
}

void LFUDB::rpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_back(value);
}

bool LFUDB::lpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.front();
        it->second.pop_front();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}

bool LFUDB::rpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.back();
        it->second.pop_back();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}

size_t LFUDB::llen(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    return it != lists_.end() ? it->second.size() : 0;
}

// Factory function
DB* create_db(const std::string& policy, size_t capacity) {
    if (policy == "LFU") return new LFUDB(capacity);
    if (policy == "ARC") return new ARCDB(capacity);
    return new LRUDB(capacity);
}

// ARCDB method implementations
ARCDB::ARCDB(size_t capacity) : cache_(new ARCCache(capacity)) {
    AOFLogger::replay(this);
    AOFLogger::clear(); // Clear AOF after replaying on startup
}

void ARCDB::set(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->put(key, value);
    AOFLogger::log("SET " + key + " " + value);
}

bool ARCDB::get(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    return cache_->get(key, value);
}

void ARCDB::del(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->erase(key);
    AOFLogger::log("DEL " + key);
}

void ARCDB::save(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    nlohmann::json j;
    
    // Save string data
    for (const auto& item : cache_->get_items()) {
        j["data"][item.first] = encrypt_data(item.second, get_encryption_key());
    }
    
    // Save list data
    for (const auto& [key, list] : lists_) {
        j["lists"][key] = list;
    }

    // Save HLL data
    for (const auto& [key, hll] : hlls_) {
        std::vector<int> registers_int(hll.get_registers().begin(), hll.get_registers().end());
        nlohmann::json hll_registers_json = registers_int;
        j["hlls"][key] = hll_registers_json;
    }
    
    std::string json_str = j.dump();
    std::string encrypted_data = encrypt_data(json_str, get_encryption_key());
    
    // Save to main file
    std::ofstream file(filename, std::ios::binary);
    file << encrypted_data;

    // Create incremental backup
    auto now = std::chrono::system_clock::now();
    auto in_time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << filename << ".backup_" << std::put_time(std::localtime(&in_time_t), "%Y%m%d_%H%M%S");
    std::ofstream backup_file(ss.str(), std::ios::binary);
    backup_file << encrypted_data;
}

void ARCDB::load(const std::string& filename) {
    std::lock_guard<std::mutex> lock(db_mutex);
    std::ifstream file(filename, std::ios::binary);
    if (file) {
        std::string encrypted_data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        std::string decrypted_data = decrypt_data(encrypted_data, get_encryption_key());
        nlohmann::json j = nlohmann::json::parse(decrypted_data);

        // Load string data
        if (j.contains("data")) {
            for (auto it = j["data"].begin(); it != j["data"].end(); ++it) {
                cache_->put(it.key(), decrypt_data(it.value().get<std::string>(), get_encryption_key()));
            }
        }

        // Load list data
        if (j.contains("lists")) {
            for (auto it = j["lists"].begin(); it != j["lists"].end(); ++it) {
                for (const auto& item : it.value()) {
                    lists_[it.key()].push_back(item.get<std::string>());
                }
            }
        }

        // Load HLL data
        if (j.contains("hlls")) {
            for (auto it = j["hlls"].begin(); it != j["hlls"].end(); ++it) {
                std::string key = it.key();
                nlohmann::json hll_registers_json = it.value();
                unsigned int precision = 16; // Default precision, assuming it's consistent
                if (hll_registers_json.is_array() && !hll_registers_json.empty()) {
                    HyperLogLog hll(precision);
                    std::vector<unsigned char> loaded_registers;
                    for (const auto& reg_val : hll_registers_json) {
                        loaded_registers.push_back(reg_val.get<unsigned char>());
                    }
                    hll.set_registers(loaded_registers);
                    hlls_[key] = hll;
                }
            }
        }
    }
}

void ARCDB::expire(const std::string& key, int seconds) {
    std::lock_guard<std::mutex> lock(db_mutex);
    cache_->set_expiry(key, seconds);
}

void ARCDB::lpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_front(value);
}

void ARCDB::rpush(const std::string& key, const std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    lists_[key].push_back(value);
}

bool ARCDB::lpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.front();
        it->second.pop_front();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}

bool ARCDB::rpop(const std::string& key, std::string& value) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    if (it != lists_.end() && !it->second.empty()) {
        value = it->second.back();
        it->second.pop_back();
        if (it->second.empty()) lists_.erase(it);
        return true;
    }
    return false;
}

size_t ARCDB::llen(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = lists_.find(key);
    return it != lists_.end() ? it->second.size() : 0;
}

void ARCDB::hll_add(const std::string& key, const std::string& element) {
    std::lock_guard<std::mutex> lock(db_mutex);
    hlls_[key].add(element);
    AOFLogger::log("HLL.ADD " + key + " " + element);
}

long long ARCDB::hll_count(const std::string& key) {
    std::lock_guard<std::mutex> lock(db_mutex);
    auto it = hlls_.find(key);
    if (it != hlls_.end()) {
        return it->second.count();
    }
    return 0;
}

ARCDB::~ARCDB() { delete cache_; }
