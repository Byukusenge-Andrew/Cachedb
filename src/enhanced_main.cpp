#include "db.h"
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

void print_help() {
    std::cout << "\n=== Enhanced MyDB CLI Help ===\n\n";
    std::cout << "String Commands:\n";
    std::cout << "  SET key value         - Set string value\n";
    std::cout << "  GET key              - Get string value\n";
    std::cout << "  INCR key             - Increment integer value\n";
    std::cout << "  DECR key             - Decrement integer value\n\n";
    
    std::cout << "List Commands:\n";
    std::cout << "  LPUSH key val1 val2  - Push values to left of list\n";
    std::cout << "  RPUSH key val1 val2  - Push values to right of list\n";
    std::cout << "  LPOP key             - Pop value from left of list\n";
    std::cout << "  RPOP key             - Pop value from right of list\n";
    std::cout << "  LLEN key             - Get list length\n";
    std::cout << "  LRANGE key start stop - Get list range\n\n";
    
    std::cout << "Set Commands:\n";
    std::cout << "  SADD key mem1 mem2   - Add members to set\n";
    std::cout << "  SREM key mem1 mem2   - Remove members from set\n";
    std::cout << "  SMEMBERS key         - Get all set members\n";
    std::cout << "  SCARD key            - Get set cardinality\n";
    std::cout << "  SISMEMBER key member - Check if member exists in set\n\n";
    
    std::cout << "Hash Commands:\n";
    std::cout << "  HSET key field value - Set hash field\n";
    std::cout << "  HGET key field       - Get hash field\n";
    std::cout << "  HDEL key field1 field2 - Delete hash fields\n";
    std::cout << "  HGETALL key          - Get all hash fields and values\n";
    std::cout << "  HKEYS key            - Get all hash field names\n";
    std::cout << "  HVALS key            - Get all hash values\n\n";
    
    std::cout << "General Commands:\n";
    std::cout << "  DEL key1 key2        - Delete keys\n";
    std::cout << "  EXISTS key           - Check if key exists\n";
    std::cout << "  TYPE key             - Get key type\n";
    std::cout << "  KEYS pattern         - Find keys matching pattern\n";
    std::cout << "  EXPIRE key seconds   - Set key expiration\n";
    std::cout << "  SAVE [filename]      - Save database to file\n";
    std::cout << "  LOAD [filename]      - Load database from file\n";
    std::cout << "  FLUSHDB              - Clear all data\n";
    std::cout << "  DBSIZE               - Get number of keys\n";
    std::cout << "  INFO                 - Get database information\n";
    std::cout << "  HELP                 - Show this help\n";
    std::cout << "  QUIT                 - Exit CLI\n\n";
}

bool is_integer(const std::string& s) {
    if (s.empty()) return false;
    size_t start = (s[0] == '-') ? 1 : 0;
    return std::all_of(s.begin() + start, s.end(), ::isdigit);
}

void print_data_type_info(DataType type) {
    switch (type) {
        case DataType::STRING: std::cout << "string"; break;
        case DataType::LIST: std::cout << "list"; break;
        case DataType::SET: std::cout << "set"; break;
        case DataType::HASH: std::cout << "hash"; break;
        case DataType::ZSET: std::cout << "zset"; break;
        default: std::cout << "unknown"; break;
    }
}

int main() {
    std::unique_ptr<DB> db(create_db("ENHANCED", 1000));
    
    std::cout << "==================================================\n";
    std::cout << "     Welcome to Enhanced MyDB CLI v2.0!\n";
    std::cout << "   Supports Redis-like commands and data types\n";
    std::cout << "==================================================\n";
    std::cout << "Type HELP for available commands.\n\n";
    
    std::string line;
    while (std::cout << "mydb> " && std::getline(std::cin, line)) {
        if (line.empty()) continue;
        
        std::istringstream iss(line);
        std::string cmd;
        iss >> cmd;
        
        // Convert command to uppercase
        std::transform(cmd.begin(), cmd.end(), cmd.begin(), ::toupper);
        
        if (cmd == "HELP") {
            print_help();
        } else if (cmd == "QUIT" || cmd == "EXIT") {
            std::cout << "Goodbye!\n";
            break;
        } else if (cmd == "SET") {
            std::string key, value;
            iss >> key >> value;
            if (key.empty() || value.empty()) {
                std::cout << "Usage: SET key value\n";
                continue;
            }
            db->set(key, value);
            std::cout << "OK\n";
        } else if (cmd == "GET") {
            std::string key, value;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: GET key\n";
                continue;
            }
            if (db->get(key, value)) {
                std::cout << "\"" << value << "\"\n";
            } else {
                std::cout << "(nil)\n";
            }
        } else if (cmd == "INCR") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: INCR key\n";
                continue;
            }
            int64_t result;
            if (db->incr(key, result)) {
                std::cout << result << "\n";
            } else {
                std::cout << "ERR value is not an integer or out of range\n";
            }
        } else if (cmd == "DECR") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: DECR key\n";
                continue;
            }
            int64_t result;
            if (db->decr(key, result)) {
                std::cout << result << "\n";
            } else {
                std::cout << "ERR value is not an integer or out of range\n";
            }
        } else if (cmd == "LPUSH") {
            std::string key, value;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: LPUSH key value1 [value2 ...]\n";
                continue;
            }
            std::vector<std::string> values;
            while (iss >> value) {
                values.push_back(value);
            }
            if (values.empty()) {
                std::cout << "Usage: LPUSH key value1 [value2 ...]\n";
                continue;
            }
            if (db->lpush(key, values)) {
                size_t length;
                db->llen(key, length);
                std::cout << length << "\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "RPUSH") {
            std::string key, value;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: RPUSH key value1 [value2 ...]\n";
                continue;
            }
            std::vector<std::string> values;
            while (iss >> value) {
                values.push_back(value);
            }
            if (values.empty()) {
                std::cout << "Usage: RPUSH key value1 [value2 ...]\n";
                continue;
            }
            if (db->rpush(key, values)) {
                size_t length;
                db->llen(key, length);
                std::cout << length << "\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "LPOP") {
            std::string key, value;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: LPOP key\n";
                continue;
            }
            if (db->lpop(key, value)) {
                std::cout << "\"" << value << "\"\n";
            } else {
                std::cout << "(nil)\n";
            }
        } else if (cmd == "RPOP") {
            std::string key, value;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: RPOP key\n";
                continue;
            }
            if (db->rpop(key, value)) {
                std::cout << "\"" << value << "\"\n";
            } else {
                std::cout << "(nil)\n";
            }
        } else if (cmd == "LLEN") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: LLEN key\n";
                continue;
            }
            size_t length;
            if (db->llen(key, length)) {
                std::cout << length << "\n";
            } else {
                std::cout << "0\n";
            }
        } else if (cmd == "LRANGE") {
            std::string key, start_str, stop_str;
            iss >> key >> start_str >> stop_str;
            if (key.empty() || start_str.empty() || stop_str.empty()) {
                std::cout << "Usage: LRANGE key start stop\n";
                continue;
            }
            try {
                int start = std::stoi(start_str);
                int stop = std::stoi(stop_str);
                std::vector<std::string> result;
                if (db->lrange(key, start, stop, result)) {
                    for (size_t i = 0; i < result.size(); ++i) {
                        std::cout << (i + 1) << ") \"" << result[i] << "\"\n";
                    }
                    if (result.empty()) {
                        std::cout << "(empty list or set)\n";
                    }
                } else {
                    std::cout << "(empty list or set)\n";
                }
            } catch (...) {
                std::cout << "ERR value is not an integer or out of range\n";
            }
        } else if (cmd == "SADD") {
            std::string key, member;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: SADD key member1 [member2 ...]\n";
                continue;
            }
            std::vector<std::string> members;
            while (iss >> member) {
                members.push_back(member);
            }
            if (members.empty()) {
                std::cout << "Usage: SADD key member1 [member2 ...]\n";
                continue;
            }
            if (db->sadd(key, members)) {
                std::cout << members.size() << "\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "SREM") {
            std::string key, member;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: SREM key member1 [member2 ...]\n";
                continue;
            }
            std::vector<std::string> members;
            while (iss >> member) {
                members.push_back(member);
            }
            if (members.empty()) {
                std::cout << "Usage: SREM key member1 [member2 ...]\n";
                continue;
            }
            if (db->srem(key, members)) {
                std::cout << members.size() << "\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "SMEMBERS") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: SMEMBERS key\n";
                continue;
            }
            std::set<std::string> members;
            if (db->smembers(key, members)) {
                int i = 1;
                for (const auto& member : members) {
                    std::cout << i++ << ") \"" << member << "\"\n";
                }
                if (members.empty()) {
                    std::cout << "(empty set)\n";
                }
            } else {
                std::cout << "(empty set)\n";
            }
        } else if (cmd == "SCARD") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: SCARD key\n";
                continue;
            }
            size_t count;
            if (db->scard(key, count)) {
                std::cout << count << "\n";
            } else {
                std::cout << "0\n";
            }
        } else if (cmd == "SISMEMBER") {
            std::string key, member;
            iss >> key >> member;
            if (key.empty() || member.empty()) {
                std::cout << "Usage: SISMEMBER key member\n";
                continue;
            }
            bool is_member = db->sismember(key, member);
            std::cout << (is_member ? "1" : "0") << "\n";
        } else if (cmd == "HSET") {
            std::string key, field, value;
            iss >> key >> field >> value;
            if (key.empty() || field.empty() || value.empty()) {
                std::cout << "Usage: HSET key field value\n";
                continue;
            }
            if (db->hset(key, field, value)) {
                std::cout << "1\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "HGET") {
            std::string key, field, value;
            iss >> key >> field;
            if (key.empty() || field.empty()) {
                std::cout << "Usage: HGET key field\n";
                continue;
            }
            if (db->hget(key, field, value)) {
                std::cout << "\"" << value << "\"\n";
            } else {
                std::cout << "(nil)\n";
            }
        } else if (cmd == "HDEL") {
            std::string key, field;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: HDEL key field1 [field2 ...]\n";
                continue;
            }
            std::vector<std::string> fields;
            while (iss >> field) {
                fields.push_back(field);
            }
            if (fields.empty()) {
                std::cout << "Usage: HDEL key field1 [field2 ...]\n";
                continue;
            }
            if (db->hdel(key, fields)) {
                std::cout << fields.size() << "\n";
            } else {
                std::cout << "ERR Operation failed\n";
            }
        } else if (cmd == "HGETALL") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: HGETALL key\n";
                continue;
            }
            std::unordered_map<std::string, std::string> result;
            if (db->hgetall(key, result)) {
                int i = 1;
                for (const auto& pair : result) {
                    std::cout << i++ << ") \"" << pair.first << "\"\n";
                    std::cout << i++ << ") \"" << pair.second << "\"\n";
                }
                if (result.empty()) {
                    std::cout << "(empty hash)\n";
                }
            } else {
                std::cout << "(empty hash)\n";
            }
        } else if (cmd == "HKEYS") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: HKEYS key\n";
                continue;
            }
            std::vector<std::string> fields;
            if (db->hkeys(key, fields)) {
                for (size_t i = 0; i < fields.size(); ++i) {
                    std::cout << (i + 1) << ") \"" << fields[i] << "\"\n";
                }
                if (fields.empty()) {
                    std::cout << "(empty hash)\n";
                }
            } else {
                std::cout << "(empty hash)\n";
            }
        } else if (cmd == "HVALS") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: HVALS key\n";
                continue;
            }
            std::vector<std::string> values;
            if (db->hvals(key, values)) {
                for (size_t i = 0; i < values.size(); ++i) {
                    std::cout << (i + 1) << ") \"" << values[i] << "\"\n";
                }
                if (values.empty()) {
                    std::cout << "(empty hash)\n";
                }
            } else {
                std::cout << "(empty hash)\n";
            }
        } else if (cmd == "DEL") {
            std::string key;
            int deleted = 0;
            while (iss >> key) {
                if (db->exists(key)) {
                    db->del(key);
                    deleted++;
                }
            }
            std::cout << deleted << "\n";
        } else if (cmd == "EXISTS") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: EXISTS key\n";
                continue;
            }
            std::cout << (db->exists(key) ? "1" : "0") << "\n";
        } else if (cmd == "TYPE") {
            std::string key;
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: TYPE key\n";
                continue;
            }
            if (!db->exists(key)) {
                std::cout << "none\n";
            } else {
                print_data_type_info(db->type(key));
                std::cout << "\n";
            }
        } else if (cmd == "KEYS") {
            std::string pattern;
            iss >> pattern;
            if (pattern.empty()) pattern = "*";
            auto keys = db->keys(pattern);
            for (size_t i = 0; i < keys.size(); ++i) {
                std::cout << (i + 1) << ") \"" << keys[i] << "\"\n";
            }
            if (keys.empty()) {
                std::cout << "(empty list or set)\n";
            }
        } else if (cmd == "EXPIRE") {
            std::string key, seconds_str;
            iss >> key >> seconds_str;
            if (key.empty() || seconds_str.empty()) {
                std::cout << "Usage: EXPIRE key seconds\n";
                continue;
            }
            try {
                int seconds = std::stoi(seconds_str);
                if (db->exists(key)) {
                    db->expire(key, seconds);
                    std::cout << "1\n";
                } else {
                    std::cout << "0\n";
                }
            } catch (...) {
                std::cout << "ERR value is not an integer or out of range\n";
            }
        } else if (cmd == "SAVE") {
            std::string filename;
            iss >> filename;
            if (filename.empty()) filename = "db.json";
            db->save(filename);
            std::cout << "OK\n";
        } else if (cmd == "LOAD") {
            std::string filename;
            iss >> filename;
            if (filename.empty()) filename = "db.json";
            db->load(filename);
            std::cout << "OK\n";
        } else if (cmd == "FLUSHDB") {
            db->flushdb();
            std::cout << "OK\n";
        } else if (cmd == "DBSIZE") {
            std::cout << db->dbsize() << "\n";
        } else if (cmd == "INFO") {
            std::cout << "# Database\n";
            std::cout << "db_size:" << db->dbsize() << "\n";
            if (auto* enhanced_db = dynamic_cast<EnhancedDB*>(db.get())) {
                std::cout << "cache_hits:" << enhanced_db->get_hits() << "\n";
                std::cout << "cache_misses:" << enhanced_db->get_misses() << "\n";
                double hit_ratio = enhanced_db->get_hits() + enhanced_db->get_misses() > 0 ? 
                    (double)enhanced_db->get_hits() / (enhanced_db->get_hits() + enhanced_db->get_misses()) * 100 : 0;
                std::cout << "hit_ratio:" << std::fixed << std::setprecision(2) << hit_ratio << "%\n";
            }
        } else {
            std::cout << "ERR unknown command '" << cmd << "'. Type HELP for available commands.\n";
        }
    }

    return 0;
}
