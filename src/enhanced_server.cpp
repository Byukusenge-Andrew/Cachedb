#include "db.h"
#include "protocol.h"
#include "pubsub.h"
#include <iostream>
#include <string>
#include <thread>
#include <fstream>
#include <json.hpp>
#include <atomic>
#include <chrono>
#include <curl/curl.h>
#include <regex>
#include <mutex>

#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#endif

#define BUFFER_SIZE 1024

struct ServerConfig {
    int port = 6379;
    int cache_size = 1000;
    std::string cache_policy = "ENHANCED";
    std::string api_key = "";
    std::string password = "";
    bool auth_required = false;
};

ServerConfig read_config() {
    ServerConfig cfg;
    std::ifstream f("config.json");
    if (f.is_open()) {
        nlohmann::json j;
        f >> j;
        if (j.contains("port")) cfg.port = j["port"];
        if (j.contains("cache_size")) cfg.cache_size = j["cache_size"];
        if (j.contains("cache_policy")) cfg.cache_policy = j["cache_policy"];
        if (j.contains("api_key")) cfg.api_key = j["api_key"];
        if (j.contains("password")) {
            cfg.password = j["password"];
            cfg.auth_required = !cfg.password.empty();
        }
    }
    return cfg;
}

class EnhancedCommandHandler {
private:
    DB* db_;
    PubSubManager* pubsub_;
    bool authenticated_;
    std::string password_;

public:
    EnhancedCommandHandler(DB* db, PubSubManager* pubsub, const std::string& password) 
        : db_(db), pubsub_(pubsub), authenticated_(!password.empty() ? false : true), password_(password) {}
    
    std::string handle_command(const std::string& input, int client_socket) {
        auto cmd = CommandParser::parse(input);
        
        // Authentication check
        if (!password_.empty() && !authenticated_ && cmd.name != "AUTH") {
            return ResponseFormatter::error("NOAUTH Authentication required");
        }
        
        if (cmd.name == "AUTH") {
            return handle_auth(cmd);
        } else if (cmd.name == "SET") {
            return handle_set(cmd);
        } else if (cmd.name == "GET") {
            return handle_get(cmd);
        } else if (cmd.name == "DEL") {
            return handle_del(cmd);
        } else if (cmd.name == "EXISTS") {
            return handle_exists(cmd);
        } else if (cmd.name == "TYPE") {
            return handle_type(cmd);
        } else if (cmd.name == "KEYS") {
            return handle_keys(cmd);
        } else if (cmd.name == "INCR") {
            return handle_incr(cmd);
        } else if (cmd.name == "DECR") {
            return handle_decr(cmd);
        } else if (cmd.name == "LPUSH") {
            return handle_lpush(cmd);
        } else if (cmd.name == "RPUSH") {
            return handle_rpush(cmd);
        } else if (cmd.name == "LPOP") {
            return handle_lpop(cmd);
        } else if (cmd.name == "RPOP") {
            return handle_rpop(cmd);
        } else if (cmd.name == "LLEN") {
            return handle_llen(cmd);
        } else if (cmd.name == "LRANGE") {
            return handle_lrange(cmd);
        } else if (cmd.name == "SADD") {
            return handle_sadd(cmd);
        } else if (cmd.name == "SREM") {
            return handle_srem(cmd);
        } else if (cmd.name == "SMEMBERS") {
            return handle_smembers(cmd);
        } else if (cmd.name == "SCARD") {
            return handle_scard(cmd);
        } else if (cmd.name == "SISMEMBER") {
            return handle_sismember(cmd);
        } else if (cmd.name == "HSET") {
            return handle_hset(cmd);
        } else if (cmd.name == "HGET") {
            return handle_hget(cmd);
        } else if (cmd.name == "HDEL") {
            return handle_hdel(cmd);
        } else if (cmd.name == "HGETALL") {
            return handle_hgetall(cmd);
        } else if (cmd.name == "HKEYS") {
            return handle_hkeys(cmd);
        } else if (cmd.name == "HVALS") {
            return handle_hvals(cmd);
        } else if (cmd.name == "SAVE") {
            return handle_save(cmd);
        } else if (cmd.name == "LOAD") {
            return handle_load(cmd);
        } else if (cmd.name == "EXPIRE") {
            return handle_expire(cmd);
        } else if (cmd.name == "FLUSHDB") {
            return handle_flushdb(cmd);
        } else if (cmd.name == "DBSIZE") {
            return handle_dbsize(cmd);
        } else if (cmd.name == "INFO") {
            return handle_info(cmd);
        } else if (cmd.name == "PING") {
            return handle_ping(cmd);
        } else if (cmd.name == "SUBSCRIBE") {
            return handle_subscribe(cmd, client_socket);
        } else if (cmd.name == "UNSUBSCRIBE") {
            return handle_unsubscribe(cmd, client_socket);
        } else if (cmd.name == "PUBLISH") {
            return handle_publish(cmd);
        } else if (cmd.name == "QUIT") {
            return "QUIT";
        } else {
            return ResponseFormatter::error("unknown command '" + cmd.name + "'");
        }
    }

private:
    std::string handle_auth(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'auth' command");
        }
        
        if (cmd.args[0] == password_) {
            authenticated_ = true;
            return ResponseFormatter::ok();
        } else {
            return ResponseFormatter::error("invalid password");
        }
    }

    std::string handle_set(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 2) {
            return ResponseFormatter::error("wrong number of arguments for 'set' command");
        }
        db_->set(cmd.args[0], cmd.args[1]);
        return ResponseFormatter::ok();
    }

    std::string handle_get(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'get' command");
        }
        std::string value;
        if (db_->get(cmd.args[0], value)) {
            return ResponseFormatter::bulk_string(value);
        }
        return ResponseFormatter::nil();
    }

    std::string handle_del(const CommandParser::Command& cmd) {
        if (cmd.args.empty()) {
            return ResponseFormatter::error("wrong number of arguments for 'del' command");
        }
        int deleted = 0;
        for (const auto& key : cmd.args) {
            if (db_->exists(key)) {
                db_->del(key);
                deleted++;
            }
        }
        return ResponseFormatter::integer(deleted);
    }

    std::string handle_exists(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'exists' command");
        }
        return ResponseFormatter::integer(db_->exists(cmd.args[0]) ? 1 : 0);
    }

    std::string handle_type(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'type' command");
        }
        
        if (!db_->exists(cmd.args[0])) {
            return ResponseFormatter::bulk_string("none");
        }
        
        DataType type = db_->type(cmd.args[0]);
        std::string type_str;
        switch (type) {
            case DataType::STRING: type_str = "string"; break;
            case DataType::LIST: type_str = "list"; break;
            case DataType::SET: type_str = "set"; break;
            case DataType::HASH: type_str = "hash"; break;
            case DataType::ZSET: type_str = "zset"; break;
            default: type_str = "unknown"; break;
        }
        return ResponseFormatter::bulk_string(type_str);
    }

    std::string handle_keys(const CommandParser::Command& cmd) {
        std::string pattern = cmd.args.empty() ? "*" : cmd.args[0];
        auto keys = db_->keys(pattern);
        return ResponseFormatter::array(keys);
    }

    std::string handle_incr(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'incr' command");
        }
        int64_t result;
        if (db_->incr(cmd.args[0], result)) {
            return ResponseFormatter::integer(result);
        }
        return ResponseFormatter::error("value is not an integer or out of range");
    }

    std::string handle_decr(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'decr' command");
        }
        int64_t result;
        if (db_->decr(cmd.args[0], result)) {
            return ResponseFormatter::integer(result);
        }
        return ResponseFormatter::error("value is not an integer or out of range");
    }

    std::string handle_lpush(const CommandParser::Command& cmd) {
        if (cmd.args.size() < 2) {
            return ResponseFormatter::error("wrong number of arguments for 'lpush' command");
        }
        std::vector<std::string> values(cmd.args.begin() + 1, cmd.args.end());
        if (db_->lpush(cmd.args[0], values)) {
            size_t length;
            db_->llen(cmd.args[0], length);
            return ResponseFormatter::integer(length);
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_rpush(const CommandParser::Command& cmd) {
        if (cmd.args.size() < 2) {
            return ResponseFormatter::error("wrong number of arguments for 'rpush' command");
        }
        std::vector<std::string> values(cmd.args.begin() + 1, cmd.args.end());
        if (db_->rpush(cmd.args[0], values)) {
            size_t length;
            db_->llen(cmd.args[0], length);
            return ResponseFormatter::integer(length);
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_lpop(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'lpop' command");
        }
        std::string value;
        if (db_->lpop(cmd.args[0], value)) {
            return ResponseFormatter::bulk_string(value);
        }
        return ResponseFormatter::nil();
    }

    std::string handle_rpop(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'rpop' command");
        }
        std::string value;
        if (db_->rpop(cmd.args[0], value)) {
            return ResponseFormatter::bulk_string(value);
        }
        return ResponseFormatter::nil();
    }

    std::string handle_llen(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'llen' command");
        }
        size_t length;
        if (db_->llen(cmd.args[0], length)) {
            return ResponseFormatter::integer(length);
        }
        return ResponseFormatter::integer(0);
    }

    std::string handle_lrange(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 3) {
            return ResponseFormatter::error("wrong number of arguments for 'lrange' command");
        }
        
        try {
            int start = std::stoi(cmd.args[1]);
            int stop = std::stoi(cmd.args[2]);
            std::vector<std::string> result;
            
            if (db_->lrange(cmd.args[0], start, stop, result)) {
                return ResponseFormatter::array(result);
            }
            return ResponseFormatter::array({});
        } catch (...) {
            return ResponseFormatter::error("value is not an integer or out of range");
        }
    }

    std::string handle_sadd(const CommandParser::Command& cmd) {
        if (cmd.args.size() < 2) {
            return ResponseFormatter::error("wrong number of arguments for 'sadd' command");
        }
        std::vector<std::string> members(cmd.args.begin() + 1, cmd.args.end());
        if (db_->sadd(cmd.args[0], members)) {
            return ResponseFormatter::integer(members.size()); // Simplified
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_srem(const CommandParser::Command& cmd) {
        if (cmd.args.size() < 2) {
            return ResponseFormatter::error("wrong number of arguments for 'srem' command");
        }
        std::vector<std::string> members(cmd.args.begin() + 1, cmd.args.end());
        if (db_->srem(cmd.args[0], members)) {
            return ResponseFormatter::integer(members.size()); // Simplified
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_smembers(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'smembers' command");
        }
        std::set<std::string> members;
        if (db_->smembers(cmd.args[0], members)) {
            std::vector<std::string> result(members.begin(), members.end());
            return ResponseFormatter::array(result);
        }
        return ResponseFormatter::array({});
    }

    std::string handle_scard(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'scard' command");
        }
        size_t count;
        if (db_->scard(cmd.args[0], count)) {
            return ResponseFormatter::integer(count);
        }
        return ResponseFormatter::integer(0);
    }

    std::string handle_sismember(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 2) {
            return ResponseFormatter::error("wrong number of arguments for 'sismember' command");
        }
        bool is_member = db_->sismember(cmd.args[0], cmd.args[1]);
        return ResponseFormatter::integer(is_member ? 1 : 0);
    }

    std::string handle_hset(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 3) {
            return ResponseFormatter::error("wrong number of arguments for 'hset' command");
        }
        if (db_->hset(cmd.args[0], cmd.args[1], cmd.args[2])) {
            return ResponseFormatter::integer(1);
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_hget(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 2) {
            return ResponseFormatter::error("wrong number of arguments for 'hget' command");
        }
        std::string value;
        if (db_->hget(cmd.args[0], cmd.args[1], value)) {
            return ResponseFormatter::bulk_string(value);
        }
        return ResponseFormatter::nil();
    }

    std::string handle_hdel(const CommandParser::Command& cmd) {
        if (cmd.args.size() < 2) {
            return ResponseFormatter::error("wrong number of arguments for 'hdel' command");
        }
        std::vector<std::string> fields(cmd.args.begin() + 1, cmd.args.end());
        if (db_->hdel(cmd.args[0], fields)) {
            return ResponseFormatter::integer(fields.size()); // Simplified
        }
        return ResponseFormatter::error("operation failed");
    }

    std::string handle_hgetall(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'hgetall' command");
        }
        std::unordered_map<std::string, std::string> result;
        if (db_->hgetall(cmd.args[0], result)) {
            std::vector<std::string> array_result;
            for (const auto& pair : result) {
                array_result.push_back(pair.first);
                array_result.push_back(pair.second);
            }
            return ResponseFormatter::array(array_result);
        }
        return ResponseFormatter::array({});
    }

    std::string handle_hkeys(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'hkeys' command");
        }
        std::vector<std::string> fields;
        if (db_->hkeys(cmd.args[0], fields)) {
            return ResponseFormatter::array(fields);
        }
        return ResponseFormatter::array({});
    }

    std::string handle_hvals(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 1) {
            return ResponseFormatter::error("wrong number of arguments for 'hvals' command");
        }
        std::vector<std::string> values;
        if (db_->hvals(cmd.args[0], values)) {
            return ResponseFormatter::array(values);
        }
        return ResponseFormatter::array({});
    }

    std::string handle_save(const CommandParser::Command& cmd) {
        std::string filename = cmd.args.empty() ? "db.json" : cmd.args[0];
        db_->save(filename);
        return ResponseFormatter::ok();
    }

    std::string handle_load(const CommandParser::Command& cmd) {
        std::string filename = cmd.args.empty() ? "db.json" : cmd.args[0];
        db_->load(filename);
        return ResponseFormatter::ok();
    }

    std::string handle_expire(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 2) {
            return ResponseFormatter::error("wrong number of arguments for 'expire' command");
        }
        try {
            int seconds = std::stoi(cmd.args[1]);
            db_->expire(cmd.args[0], seconds);
            return ResponseFormatter::integer(1);
        } catch (...) {
            return ResponseFormatter::error("value is not an integer or out of range");
        }
    }

    std::string handle_flushdb(const CommandParser::Command& cmd) {
        db_->flushdb();
        return ResponseFormatter::ok();
    }

    std::string handle_dbsize(const CommandParser::Command& cmd) {
        return ResponseFormatter::integer(db_->dbsize());
    }

    std::string handle_info(const CommandParser::Command& cmd) {
        // Get stats from EnhancedDB if possible
        std::string info = "# Server\r\n";
        info += "redis_version:7.0.0-compatible\r\n";
        info += "# Keyspace\r\n";
        info += "db0:keys=" + std::to_string(db_->dbsize()) + ",expires=0,avg_ttl=0\r\n";
        
        // Try to get cache stats
        if (auto* enhanced_db = dynamic_cast<EnhancedDB*>(db_)) {
            info += "# Stats\r\n";
            info += "keyspace_hits:" + std::to_string(enhanced_db->get_hits()) + "\r\n";
            info += "keyspace_misses:" + std::to_string(enhanced_db->get_misses()) + "\r\n";
        }
        
        return ResponseFormatter::bulk_string(info);
    }

    std::string handle_ping(const CommandParser::Command& cmd) {
        if (cmd.args.empty()) {
            return ResponseFormatter::bulk_string("PONG");
        } else {
            return ResponseFormatter::bulk_string(cmd.args[0]);
        }
    }

    std::string handle_subscribe(const CommandParser::Command& cmd, int client_socket) {
        if (cmd.args.empty()) {
            return ResponseFormatter::error("wrong number of arguments for 'subscribe' command");
        }
        
        for (const auto& channel : cmd.args) {
            pubsub_->subscribe(channel, client_socket);
        }
        
        // Return subscription confirmation
        std::vector<std::string> response = {"subscribe", cmd.args[0], "1"};
        return ResponseFormatter::array(response);
    }

    std::string handle_unsubscribe(const CommandParser::Command& cmd, int client_socket) {
        if (cmd.args.empty()) {
            return ResponseFormatter::error("wrong number of arguments for 'unsubscribe' command");
        }
        
        for (const auto& channel : cmd.args) {
            pubsub_->unsubscribe(channel, client_socket);
        }
        
        // Return unsubscription confirmation
        std::vector<std::string> response = {"unsubscribe", cmd.args[0], "0"};
        return ResponseFormatter::array(response);
    }

    std::string handle_publish(const CommandParser::Command& cmd) {
        if (cmd.args.size() != 2) {
            return ResponseFormatter::error("wrong number of arguments for 'publish' command");
        }
        
        pubsub_->publish(cmd.args[0], cmd.args[1]);
        return ResponseFormatter::integer(1); // Simplified: always return 1
    }
};

void handle_client(int client_sock, DB* db, PubSubManager* pubsub, const std::string& password) {
    EnhancedCommandHandler handler(db, pubsub, password);
    char buffer[BUFFER_SIZE];
    
    while (true) {
        int bytes = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);
        if (bytes <= 0) break;
        
        buffer[bytes] = '\0';
        std::string input(buffer);
        
        // Remove trailing \r\n
        while (!input.empty() && (input.back() == '\r' || input.back() == '\n')) {
            input.pop_back();
        }
        
        if (input.empty()) continue;
        
        std::string response = handler.handle_command(input, client_sock);
        
        if (response == "QUIT") break;
        
        send(client_sock, response.c_str(), response.size(), 0);
    }
    
#ifdef _WIN32
    closesocket(client_sock);
#else
    close(client_sock);
#endif
}

// Rest of server code (AI optimization, main function) remains similar to the original
std::string GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

std::string get_db_stats(DB* db) {
    std::ostringstream oss;
    if (auto enhanced = dynamic_cast<EnhancedDB*>(db)) {
        oss << "hits: " << enhanced->get_hits() << ", misses: " << enhanced->get_misses() << ", size: " << enhanced->dbsize();
    } else if (auto lru = dynamic_cast<LRUDB*>(db)) {
        oss << "hits: " << lru->cache_->get_hits() << ", misses: " << lru->cache_->get_misses();
    } else if (auto lfu = dynamic_cast<LFUDB*>(db)) {
        oss << "hits: " << lfu->cache_->get_hits() << ", misses: " << lfu->cache_->get_misses();
    }
    return oss.str();
}

size_t curl_write_cb(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::mutex db_swap_mutex;

void update_config_and_db(const std::string& suggestion, ServerConfig& cfg, std::unique_ptr<DB>& db) {
    bool changed = false;
    std::smatch match;
    if (std::regex_search(suggestion, match, std::regex("cache_policy to (ENHANCED|LFU|LRU)", std::regex::icase))) {
        std::string new_policy = match[1].str();
        if (cfg.cache_policy != new_policy) {
            cfg.cache_policy = new_policy;
            changed = true;
        }
    }
    if (std::regex_search(suggestion, match, std::regex("cache_size to (\\d+)", std::regex::icase))) {
        int new_size = std::stoi(match[1].str());
        if (cfg.cache_size != new_size) {
            cfg.cache_size = new_size;
            changed = true;
        }
    }
    if (changed) {
        std::ofstream f("config.json");
        f << "{\n  \"port\": " << cfg.port << ",\n  \"cache_size\": " << cfg.cache_size 
          << ",\n  \"cache_policy\": \"" << cfg.cache_policy << "\",\n  \"api_key\": \"" 
          << cfg.api_key << "\"\n}";
        f.close();
        
        std::lock_guard<std::mutex> lock(db_swap_mutex);
        db.reset(create_db(cfg.cache_policy, cfg.cache_size));
        std::cout << "[AI] DB reconfigured: policy=" << cfg.cache_policy << ", size=" << cfg.cache_size << std::endl;
    }
}

void ai_optimize_loop(DB* db, std::atomic<bool>& running, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr) {
    while (running) {
        std::this_thread::sleep_for(std::chrono::minutes(5));
        if (!running) break;
        
        std::string stats = get_db_stats(db);
        std::string prompt = "Suggest cache optimizations for these stats: " + stats;
        std::string response;
        
        CURL* curl = curl_easy_init();
        if (curl) {
            struct curl_slist* headers = nullptr;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            std::string api_header = "X-goog-api-key: " + api_key;
            headers = curl_slist_append(headers, api_header.c_str());
            
            std::string data = "{\"contents\":[{\"parts\":[{\"text\":\"" + prompt + "\"}]}]}";
            
            curl_easy_setopt(curl, CURLOPT_URL, GEMINI_API_URL.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
            
            curl_easy_perform(curl);
            curl_easy_cleanup(curl);
        }
        
        if (!response.empty()) {
            std::cout << "[AI Suggestion] " << response << std::endl;
            update_config_and_db(response, cfg, db_ptr);
        }
    }
}

int main() {
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2,2), &wsaData);
#endif

    ServerConfig cfg = read_config();
    std::unique_ptr<DB> db(create_db(cfg.cache_policy, cfg.cache_size));
    std::unique_ptr<PubSubManager> pubsub(new PubSubManager());
    
    std::atomic<bool> running(true);
    
    // Start AI optimization thread if API key is provided
    std::thread ai_thread;
    if (!cfg.api_key.empty()) {
        ai_thread = std::thread(ai_optimize_loop, db.get(), std::ref(running), cfg.api_key, std::ref(cfg), std::ref(db));
        ai_thread.detach();
    }
    
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == -1) {
        std::cerr << "Failed to create socket" << std::endl;
        return 1;
    }
    
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(cfg.port);
    
    if (bind(server_fd, (sockaddr*)&addr, sizeof(addr)) == -1) {
        std::cerr << "Failed to bind to port " << cfg.port << std::endl;
        return 1;
    }
    
    if (listen(server_fd, 5) == -1) {
        std::cerr << "Failed to listen on socket" << std::endl;
        return 1;
    }
    
    std::cout << "Enhanced Redis-like server listening on port " << cfg.port << std::endl;
    std::cout << "Database policy: " << cfg.cache_policy << ", Cache size: " << cfg.cache_size << std::endl;
    
    if (cfg.auth_required) {
        std::cout << "Authentication required" << std::endl;
    }
    
    while (true) {
        int client_sock = accept(server_fd, nullptr, nullptr);
        if (client_sock == -1) continue;
        
        std::lock_guard<std::mutex> lock(db_swap_mutex);
        std::thread(handle_client, client_sock, db.get(), pubsub.get(), cfg.password).detach();
    }

#ifdef _WIN32
    closesocket(server_fd);
    WSACleanup();
#else
    close(server_fd);
#endif

    running = false;
    return 0;
}
