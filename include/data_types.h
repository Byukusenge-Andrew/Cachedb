#pragma once
#include <string>
#include <vector>
#include <set>
#include <unordered_map>
#include <variant>
#include <json.hpp>

// Different data types that can be stored
enum class DataType {
    STRING,
    LIST,
    SET,
    HASH,
    ZSET  // Sorted set
};

// Value container for different data types
struct DataValue {
    DataType type;
    std::variant<
        std::string,                                    // STRING
        std::vector<std::string>,                       // LIST
        std::set<std::string>,                         // SET
        std::unordered_map<std::string, std::string>,  // HASH
        std::map<std::string, double>                  // ZSET (member -> score)
    > data;
    
    DataValue() : type(DataType::STRING), data(std::string()) {}
    DataValue(const std::string& str) : type(DataType::STRING), data(str) {}
    DataValue(const std::vector<std::string>& list) : type(DataType::LIST), data(list) {}
    DataValue(const std::set<std::string>& set) : type(DataType::SET), data(set) {}
    DataValue(const std::unordered_map<std::string, std::string>& hash) : type(DataType::HASH), data(hash) {}
    DataValue(const std::map<std::string, double>& zset) : type(DataType::ZSET), data(zset) {}
    
    // Convert to JSON for persistence
    nlohmann::json to_json() const;
    static DataValue from_json(const nlohmann::json& j);
    
    // Get string representation
    std::string to_string() const;
};

// Database operations for different data types
class DataOperations {
public:
    // String operations
    static bool set_string(std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, const std::string& value);
    static bool get_string(const std::unordered_map<std::string, DataValue>& storage, 
                          const std::string& key, std::string& value);
    static bool incr(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, int64_t& result);
    static bool decr(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, int64_t& result);
    
    // List operations
    static bool lpush(std::unordered_map<std::string, DataValue>& storage, 
                     const std::string& key, const std::vector<std::string>& values);
    static bool rpush(std::unordered_map<std::string, DataValue>& storage, 
                     const std::string& key, const std::vector<std::string>& values);
    static bool lpop(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, std::string& value);
    static bool rpop(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, std::string& value);
    static bool llen(const std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, size_t& length);
    static bool lrange(const std::unordered_map<std::string, DataValue>& storage, 
                      const std::string& key, int start, int stop, std::vector<std::string>& result);
    
    // Set operations
    static bool sadd(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, const std::vector<std::string>& members);
    static bool srem(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, const std::vector<std::string>& members);
    static bool smembers(const std::unordered_map<std::string, DataValue>& storage, 
                        const std::string& key, std::set<std::string>& members);
    static bool scard(const std::unordered_map<std::string, DataValue>& storage, 
                     const std::string& key, size_t& count);
    static bool sismember(const std::unordered_map<std::string, DataValue>& storage, 
                         const std::string& key, const std::string& member);
    
    // Hash operations
    static bool hset(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, const std::string& field, const std::string& value);
    static bool hget(const std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, const std::string& field, std::string& value);
    static bool hdel(std::unordered_map<std::string, DataValue>& storage, 
                    const std::string& key, const std::vector<std::string>& fields);
    static bool hgetall(const std::unordered_map<std::string, DataValue>& storage, 
                       const std::string& key, std::unordered_map<std::string, std::string>& result);
    static bool hkeys(const std::unordered_map<std::string, DataValue>& storage, 
                     const std::string& key, std::vector<std::string>& fields);
    static bool hvals(const std::unordered_map<std::string, DataValue>& storage, 
                     const std::string& key, std::vector<std::string>& values);
    
    // General operations
    static bool exists(const std::unordered_map<std::string, DataValue>& storage, 
                      const std::string& key);
    static bool del(std::unordered_map<std::string, DataValue>& storage, 
                   const std::string& key);
    static DataType type(const std::unordered_map<std::string, DataValue>& storage, 
                        const std::string& key);
    static std::vector<std::string> keys(const std::unordered_map<std::string, DataValue>& storage, 
                                        const std::string& pattern = "*");
};
