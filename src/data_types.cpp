#include "data_types.h"
#include <algorithm>
#include <sstream>
#include <regex>

// DataValue implementations
nlohmann::json DataValue::to_json() const {
    nlohmann::json j;
    j["type"] = static_cast<int>(type);
    
    switch (type) {
        case DataType::STRING:
            j["data"] = std::get<std::string>(data);
            break;
        case DataType::LIST:
            j["data"] = std::get<std::vector<std::string>>(data);
            break;
        case DataType::SET: {
            auto& set_data = std::get<std::set<std::string>>(data);
            j["data"] = std::vector<std::string>(set_data.begin(), set_data.end());
            break;
        }
        case DataType::HASH:
            j["data"] = std::get<std::unordered_map<std::string, std::string>>(data);
            break;
        case DataType::ZSET: {
            auto& zset_data = std::get<std::map<std::string, double>>(data);
            for (const auto& pair : zset_data) {
                j["data"][pair.first] = pair.second;
            }
            break;
        }
    }
    return j;
}

DataValue DataValue::from_json(const nlohmann::json& j) {
    DataType type = static_cast<DataType>(j["type"]);
    
    switch (type) {
        case DataType::STRING:
            return DataValue(j["data"].get<std::string>());
        case DataType::LIST:
            return DataValue(j["data"].get<std::vector<std::string>>());
        case DataType::SET: {
            auto vec = j["data"].get<std::vector<std::string>>();
            std::set<std::string> set_data(vec.begin(), vec.end());
            return DataValue(set_data);
        }
        case DataType::HASH:
            return DataValue(j["data"].get<std::unordered_map<std::string, std::string>>());
        case DataType::ZSET: {
            std::map<std::string, double> zset_data;
            for (auto it = j["data"].begin(); it != j["data"].end(); ++it) {
                zset_data[it.key()] = it.value();
            }
            return DataValue(zset_data);
        }
    }
    return DataValue();
}

std::string DataValue::to_string() const {
    switch (type) {
        case DataType::STRING:
            return std::get<std::string>(data);
        case DataType::LIST: {
            auto& list_data = std::get<std::vector<std::string>>(data);
            std::ostringstream oss;
            oss << "[";
            for (size_t i = 0; i < list_data.size(); ++i) {
                if (i > 0) oss << ", ";
                oss << "\"" << list_data[i] << "\"";
            }
            oss << "]";
            return oss.str();
        }
        case DataType::SET: {
            auto& set_data = std::get<std::set<std::string>>(data);
            std::ostringstream oss;
            oss << "{";
            bool first = true;
            for (const auto& item : set_data) {
                if (!first) oss << ", ";
                oss << "\"" << item << "\"";
                first = false;
            }
            oss << "}";
            return oss.str();
        }
        case DataType::HASH: {
            auto& hash_data = std::get<std::unordered_map<std::string, std::string>>(data);
            std::ostringstream oss;
            oss << "{";
            bool first = true;
            for (const auto& pair : hash_data) {
                if (!first) oss << ", ";
                oss << "\"" << pair.first << "\": \"" << pair.second << "\"";
                first = false;
            }
            oss << "}";
            return oss.str();
        }
        case DataType::ZSET: {
            auto& zset_data = std::get<std::map<std::string, double>>(data);
            std::ostringstream oss;
            oss << "{";
            bool first = true;
            for (const auto& pair : zset_data) {
                if (!first) oss << ", ";
                oss << "\"" << pair.first << "\": " << pair.second;
                first = false;
            }
            oss << "}";
            return oss.str();
        }
    }
    return "";
}

// String operations
bool DataOperations::set_string(std::unordered_map<std::string, DataValue>& storage, 
                                const std::string& key, const std::string& value) {
    storage[key] = DataValue(value);
    return true;
}

bool DataOperations::get_string(const std::unordered_map<std::string, DataValue>& storage, 
                                const std::string& key, std::string& value) {
    auto it = storage.find(key);
    if (it != storage.end() && it->second.type == DataType::STRING) {
        value = std::get<std::string>(it->second.data);
        return true;
    }
    return false;
}

bool DataOperations::incr(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, int64_t& result) {
    auto it = storage.find(key);
    if (it == storage.end()) {
        storage[key] = DataValue("1");
        result = 1;
        return true;
    }
    
    if (it->second.type != DataType::STRING) return false;
    
    try {
        int64_t val = std::stoll(std::get<std::string>(it->second.data));
        val++;
        storage[key] = DataValue(std::to_string(val));
        result = val;
        return true;
    } catch (...) {
        return false;
    }
}

bool DataOperations::decr(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, int64_t& result) {
    auto it = storage.find(key);
    if (it == storage.end()) {
        storage[key] = DataValue("-1");
        result = -1;
        return true;
    }
    
    if (it->second.type != DataType::STRING) return false;
    
    try {
        int64_t val = std::stoll(std::get<std::string>(it->second.data));
        val--;
        storage[key] = DataValue(std::to_string(val));
        result = val;
        return true;
    } catch (...) {
        return false;
    }
}

// List operations
bool DataOperations::lpush(std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, const std::vector<std::string>& values) {
    auto it = storage.find(key);
    std::vector<std::string> list_data;
    
    if (it != storage.end()) {
        if (it->second.type != DataType::LIST) return false;
        list_data = std::get<std::vector<std::string>>(it->second.data);
    }
    
    // Insert at beginning (reverse order to maintain Redis behavior)
    for (auto it = values.rbegin(); it != values.rend(); ++it) {
        list_data.insert(list_data.begin(), *it);
    }
    
    storage[key] = DataValue(list_data);
    return true;
}

bool DataOperations::rpush(std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, const std::vector<std::string>& values) {
    auto it = storage.find(key);
    std::vector<std::string> list_data;
    
    if (it != storage.end()) {
        if (it->second.type != DataType::LIST) return false;
        list_data = std::get<std::vector<std::string>>(it->second.data);
    }
    
    // Insert at end
    for (const auto& value : values) {
        list_data.push_back(value);
    }
    
    storage[key] = DataValue(list_data);
    return true;
}

bool DataOperations::lpop(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, std::string& value) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::LIST) return false;
    
    auto& list_data = std::get<std::vector<std::string>>(it->second.data);
    if (list_data.empty()) return false;
    
    value = list_data.front();
    list_data.erase(list_data.begin());
    
    if (list_data.empty()) {
        storage.erase(it);
    }
    
    return true;
}

bool DataOperations::rpop(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, std::string& value) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::LIST) return false;
    
    auto& list_data = std::get<std::vector<std::string>>(it->second.data);
    if (list_data.empty()) return false;
    
    value = list_data.back();
    list_data.pop_back();
    
    if (list_data.empty()) {
        storage.erase(it);
    }
    
    return true;
}

bool DataOperations::llen(const std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, size_t& length) {
    auto it = storage.find(key);
    if (it == storage.end()) {
        length = 0;
        return true;
    }
    
    if (it->second.type != DataType::LIST) return false;
    
    length = std::get<std::vector<std::string>>(it->second.data).size();
    return true;
}

bool DataOperations::lrange(const std::unordered_map<std::string, DataValue>& storage, 
                           const std::string& key, int start, int stop, std::vector<std::string>& result) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::LIST) return false;
    
    const auto& list_data = std::get<std::vector<std::string>>(it->second.data);
    int size = static_cast<int>(list_data.size());
    
    // Handle negative indices
    if (start < 0) start += size;
    if (stop < 0) stop += size;
    
    // Bounds checking
    start = std::max(0, start);
    stop = std::min(size - 1, stop);
    
    if (start <= stop) {
        result.assign(list_data.begin() + start, list_data.begin() + stop + 1);
    }
    
    return true;
}

// Set operations
bool DataOperations::sadd(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::vector<std::string>& members) {
    auto it = storage.find(key);
    std::set<std::string> set_data;
    
    if (it != storage.end()) {
        if (it->second.type != DataType::SET) return false;
        set_data = std::get<std::set<std::string>>(it->second.data);
    }
    
    for (const auto& member : members) {
        set_data.insert(member);
    }
    
    storage[key] = DataValue(set_data);
    return true;
}

bool DataOperations::srem(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::vector<std::string>& members) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::SET) return false;
    
    auto& set_data = std::get<std::set<std::string>>(it->second.data);
    
    for (const auto& member : members) {
        set_data.erase(member);
    }
    
    if (set_data.empty()) {
        storage.erase(it);
    }
    
    return true;
}

bool DataOperations::smembers(const std::unordered_map<std::string, DataValue>& storage, 
                             const std::string& key, std::set<std::string>& members) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::SET) return false;
    
    members = std::get<std::set<std::string>>(it->second.data);
    return true;
}

bool DataOperations::scard(const std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, size_t& count) {
    auto it = storage.find(key);
    if (it == storage.end()) {
        count = 0;
        return true;
    }
    
    if (it->second.type != DataType::SET) return false;
    
    count = std::get<std::set<std::string>>(it->second.data).size();
    return true;
}

bool DataOperations::sismember(const std::unordered_map<std::string, DataValue>& storage, 
                              const std::string& key, const std::string& member) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::SET) return false;
    
    const auto& set_data = std::get<std::set<std::string>>(it->second.data);
    return set_data.find(member) != set_data.end();
}

// Hash operations
bool DataOperations::hset(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::string& field, const std::string& value) {
    auto it = storage.find(key);
    std::unordered_map<std::string, std::string> hash_data;
    
    if (it != storage.end()) {
        if (it->second.type != DataType::HASH) return false;
        hash_data = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    }
    
    hash_data[field] = value;
    storage[key] = DataValue(hash_data);
    return true;
}

bool DataOperations::hget(const std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::string& field, std::string& value) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::HASH) return false;
    
    const auto& hash_data = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    auto field_it = hash_data.find(field);
    if (field_it == hash_data.end()) return false;
    
    value = field_it->second;
    return true;
}

bool DataOperations::hdel(std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::vector<std::string>& fields) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::HASH) return false;
    
    auto& hash_data = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    
    for (const auto& field : fields) {
        hash_data.erase(field);
    }
    
    if (hash_data.empty()) {
        storage.erase(it);
    }
    
    return true;
}

bool DataOperations::hgetall(const std::unordered_map<std::string, DataValue>& storage, 
                            const std::string& key, std::unordered_map<std::string, std::string>& result) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::HASH) return false;
    
    result = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    return true;
}

bool DataOperations::hkeys(const std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, std::vector<std::string>& fields) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::HASH) return false;
    
    const auto& hash_data = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    for (const auto& pair : hash_data) {
        fields.push_back(pair.first);
    }
    return true;
}

bool DataOperations::hvals(const std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, std::vector<std::string>& values) {
    auto it = storage.find(key);
    if (it == storage.end() || it->second.type != DataType::HASH) return false;
    
    const auto& hash_data = std::get<std::unordered_map<std::string, std::string>>(it->second.data);
    for (const auto& pair : hash_data) {
        values.push_back(pair.second);
    }
    return true;
}

// General operations
bool DataOperations::exists(const std::unordered_map<std::string, DataValue>& storage, 
                           const std::string& key) {
    return storage.find(key) != storage.end();
}

bool DataOperations::del(std::unordered_map<std::string, DataValue>& storage, 
                        const std::string& key) {
    return storage.erase(key) > 0;
}

DataType DataOperations::type(const std::unordered_map<std::string, DataValue>& storage, 
                             const std::string& key) {
    auto it = storage.find(key);
    if (it == storage.end()) return DataType::STRING; // Default
    return it->second.type;
}

std::vector<std::string> DataOperations::keys(const std::unordered_map<std::string, DataValue>& storage, 
                                              const std::string& pattern) {
    std::vector<std::string> result;
    
    if (pattern == "*") {
        for (const auto& pair : storage) {
            result.push_back(pair.first);
        }
    } else {
        // Simple pattern matching (*, ?)
        std::string regex_pattern = pattern;
        std::replace(regex_pattern.begin(), regex_pattern.end(), '*', '.');
        regex_pattern = std::regex_replace(regex_pattern, std::regex("\\."), ".*");
        std::replace(regex_pattern.begin(), regex_pattern.end(), '?', '.');
        
        std::regex re(regex_pattern);
        for (const auto& pair : storage) {
            if (std::regex_match(pair.first, re)) {
                result.push_back(pair.first);
            }
        }
    }
    
    return result;
}
