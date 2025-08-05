#include "db.h"
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

// Read config from config.json
struct ServerConfig {
    int port = 6379;
    int cache_size = 100;
    std::string cache_policy = "LRU";
    std::string api_key;
};

ServerConfig read_config() {
    ServerConfig cfg;
    std::ifstream f("config.json");
    if (f) {
        nlohmann::json j; f >> j;
        if (j.contains("port")) cfg.port = j["port"];
        if (j.contains("cache_size")) cfg.cache_size = j["cache_size"];
        std::string cache_policy = "LRU";
        if (j.contains("cache_policy")) cache_policy = j["cache_policy"];
        cfg.cache_policy = cache_policy;
        std::string api_key;
        if (j.contains("api_key")) cfg.api_key = j["api_key"];
    }
    return cfg;
}

void handle_client(int client_sock, DB* db) {
    char buffer[BUFFER_SIZE];
    std::string cmd, key, value;
    while (true) {
        int bytes = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);
        if (bytes <= 0) break;
        buffer[bytes] = '\0';
        std::istringstream iss(buffer);
        iss >> cmd;
        if (cmd == "SET") {
            iss >> key >> value;
            db->set(key, value);
            send(client_sock, "+OK\n", 4, 0);
        } else if (cmd == "GET") {
            iss >> key;
            if (db->get(key, value)) {
                send(client_sock, value.c_str(), value.size(), 0);
                send(client_sock, "\n", 1, 0);
            } else {
                send(client_sock, "(nil)\n", 6, 0);
            }
        } else if (cmd == "DEL") {
            iss >> key;
            db->del(key);
            send(client_sock, "+OK\n", 4, 0);
        } else if (cmd == "QUIT") {
            break;
        } else if (cmd == "EXPIRE") {
            int seconds;
            iss >> key >> seconds;
            if (key.empty() || !iss) {
                send(client_sock, "Usage: EXPIRE key seconds\n", 26, 0);
                continue;
            }
            db->expire(key, seconds);
            send(client_sock, "+OK\n", 4, 0);
        } else {
            send(client_sock, "ERR\n", 4, 0);
        }
    }
#ifdef _WIN32
    closesocket(client_sock);
#else
    close(client_sock);
#endif
}

std::string GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

std::string get_db_stats(DB* db) {
    // For demo: only LRUDB/LFUDB, dynamic_cast to get stats
    std::ostringstream oss;
    if (auto lru = dynamic_cast<LRUDB*>(db)) {
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
    if (std::regex_search(suggestion, match, std::regex("cache_policy to (LFU|LRU)", std::regex::icase))) {
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
        // Update config.json
        std::ofstream f("config.json");
        f << "{\n  \"port\": " << cfg.port << ",\n  \"cache_size\": " << cfg.cache_size << ",\n  \"cache_policy\": \"" << cfg.cache_policy << "\",\n  \"api_key\": \"" << cfg.api_key << "\"\n}";
        f.close();
        // Swap DB
        std::lock_guard<std::mutex> lock(db_swap_mutex);
        db.reset(create_db(cfg.cache_policy, cfg.cache_size));
        std::cout << "[AI] DB reconfigured: policy=" << cfg.cache_policy << ", size=" << cfg.cache_size << std::endl;
    }
}

void ai_optimize_loop(DB* db, std::atomic<bool>& running, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr) {
    while (running) {
        std::this_thread::sleep_for(std::chrono::minutes(5));
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
        std::cout << "[AI Suggestion] " << response << std::endl;
        update_config_and_db(response, cfg, db_ptr);
    }
}

int main() {
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2,2), &wsaData);
#endif
    ServerConfig cfg = read_config();
    std::unique_ptr<DB> db(create_db(cfg.cache_policy, cfg.cache_size));
    std::atomic<bool> running(true);
    std::thread(ai_optimize_loop, db.get(), std::ref(running), cfg.api_key, std::ref(cfg), std::ref(db)).detach();
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(cfg.port);
    bind(server_fd, (sockaddr*)&addr, sizeof(addr));
    listen(server_fd, 5);
    std::cout << "Server listening on port " << cfg.port << std::endl;
    while (true) {
        int client_sock = accept(server_fd, nullptr, nullptr);
        std::lock_guard<std::mutex> lock(db_swap_mutex);
        std::thread(handle_client, client_sock, db.get()).detach();
    }
#ifdef _WIN32
    closesocket(server_fd);
    WSACleanup();
#else
    close(server_fd);
#endif
    return 0;
}
