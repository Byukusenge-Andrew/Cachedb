#include "db.h"
#include <iostream>
#include <string>
#include <thread>
#include <fstream>
#include <sstream>
#include <memory>
#include <json.hpp>
#include <atomic>
#include <chrono>
#include <curl/curl.h>
#include <regex>
#include <mutex>
#include "cluster.h"
#include "pubsub.h"
#include <openssl/ssl.h> // For SSL/TLS
#include <openssl/err.h> // For SSL error handling

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h> // Required for inet_pton on Windows
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h> // For inet_pton on Linux
#include <unistd.h>
#endif

#define BUFFER_SIZE 16384 // Increased buffer size to handle larger responses

// Forward declarations
struct ServerConfig;
class DB;
void update_config_and_db(const std::string& suggestion, ServerConfig& cfg, std::unique_ptr<DB>& db);
std::string generate_and_apply_ai_suggestion(DB* db, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr);

// Server configuration
struct ServerConfig {
    int port = 6379;
    int cache_size = 100;
    std::string cache_policy = "LRU";
    std::string api_key;
    std::string password;
    ClusterManager cluster_manager;
    std::unique_ptr<PubSubManager> pubsub_manager;
    std::string cert_path;
    std::string key_path;
    
    ServerConfig() : pubsub_manager(std::make_unique<PubSubManager>()) {}
    
    // Delete copy constructor and assignment operator
    ServerConfig(const ServerConfig&) = delete;
    ServerConfig& operator=(const ServerConfig&) = delete;
    
    // Allow move constructor and assignment operator
    ServerConfig(ServerConfig&&) = default;
    ServerConfig& operator=(ServerConfig&&) = default;
};

// Function to initialize SSL
SSL_CTX* init_ssl_ctx() {
    SSL_CTX* ctx;
    SSL_library_init();
    OpenSSL_add_all_algorithms();
    SSL_load_error_strings();
    const SSL_METHOD* method = TLS_server_method(); // Use TLS_server_method for modern TLS
    ctx = SSL_CTX_new(method);
    if (!ctx) {
        ERR_print_errors_fp(stderr);
        abort();
    }
    return ctx;
}

// Function to load certificate and private key
void load_certificates(SSL_CTX* ctx, const std::string& cert_path, const std::string& key_path) {
    if (SSL_CTX_use_certificate_file(ctx, cert_path.c_str(), SSL_FILETYPE_PEM) <= 0) {
        ERR_print_errors_fp(stderr);
        abort();
    }
    if (SSL_CTX_use_PrivateKey_file(ctx, key_path.c_str(), SSL_FILETYPE_PEM) <= 0) {
        ERR_print_errors_fp(stderr);
        abort();
    }
    if (!SSL_CTX_check_private_key(ctx)) {
        fprintf(stderr, "Private key does not match the public certificate\n");
        abort();
    }
}

ServerConfig read_config() {
    ServerConfig cfg;
    std::ifstream f("config.json");
    if (!f.is_open()) {
        std::cerr << "[ERROR] Could not open config.json. Using default configuration." << std::endl;
        return cfg;
    }
    
    std::string config_content((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
    f.close();

    try {
        nlohmann::json j = nlohmann::json::parse(config_content);
        if (j.contains("port")) cfg.port = j["port"].get<int>();
        if (j.contains("cache_size")) cfg.cache_size = j["cache_size"].get<int>();
        if (j.contains("cache_policy")) cfg.cache_policy = j["cache_policy"].get<std::string>();
        if (j.contains("api_key")) cfg.api_key = j["api_key"].get<std::string>();
        if (j.contains("password")) cfg.password = j["password"].get<std::string>();
        if (j.contains("cluster_nodes")) {
            for (const auto& node_str : j["cluster_nodes"]) {
                std::string node_info = node_str.get<std::string>();
                size_t colon_pos = node_info.find(":");
                if (colon_pos != std::string::npos) {
                    std::string host = node_info.substr(0, colon_pos);
                    int port = std::stoi(node_info.substr(colon_pos + 1));
                    cfg.cluster_manager.add_node(host, port);
                }
            }
        }
        if (j.contains("cert_path")) cfg.cert_path = j["cert_path"].get<std::string>();
        if (j.contains("key_path")) cfg.key_path = j["key_path"].get<std::string>();
    } catch (const nlohmann::json::exception& e) {
        std::cerr << "[ERROR] Failed to parse config.json: " << e.what() << std::endl;
    }
    return cfg;
}

size_t curl_write_cb(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::string get_db_stats(DB* db) {
    std::ostringstream oss;
    if (auto lru = dynamic_cast<LRUDB*>(db)) {
        oss << "hits: " << lru->cache_->get_hits() 
            << ", misses: " << lru->cache_->get_misses()
            << ", avg_hit_latency_ms: " << lru->cache_->get_avg_hit_latency()
            << ", evictions: " << lru->cache_->get_eviction_count();
    } else if (auto lfu = dynamic_cast<LFUDB*>(db)) {
        oss << "hits: " << lfu->cache_->get_hits() 
            << ", misses: " << lfu->cache_->get_misses()
            << ", avg_hit_latency_ms: " << lfu->cache_->get_avg_hit_latency()
            << ", evictions: " << lfu->cache_->get_eviction_count();
    } else if (auto arc = dynamic_cast<ARCDB*>(db)) {
        oss << "hits: " << arc->cache_->get_hits() 
            << ", misses: " << arc->cache_->get_misses()
            << ", avg_hit_latency_ms: " << arc->cache_->get_avg_hit_latency()
            << ", evictions: " << arc->cache_->get_eviction_count();
    }
    return oss.str();
}

std::mutex db_swap_mutex;

// Helper function to write response to client (SSL or non-SSL)
void write_response(int client_sock, SSL* ssl, const std::string& response) {
    if (ssl) {
        SSL_write(ssl, response.c_str(), response.size());
    } else {
        send(client_sock, response.c_str(), response.size(), 0);
    }
}

// Helper function to read from client (SSL or non-SSL)
int read_from_client(int client_sock, SSL* ssl, char* buffer, int buffer_size) {
    if (ssl) {
        return SSL_read(ssl, buffer, buffer_size);
    } else {
        return recv(client_sock, buffer, buffer_size, 0);
    }
}

std::string generate_and_apply_ai_suggestion(DB* db, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr) {
    std::string stats = get_db_stats(db);
    std::string prompt = "Given the following database cache statistics (hits, misses, average hit latency in milliseconds, and eviction count), suggest cache policy and/or size optimizations. Respond with only the suggested changes, for example: 'cache_policy to LFU, cache_size to 200'. Stats: " + stats;
    std::string response;
    CURL* curl = curl_easy_init();
    if (curl) {
        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        std::string api_header = "X-goog-api-key: " + api_key;
        headers = curl_slist_append(headers, api_header.c_str());
        std::string data = "{\"contents\":[{\"parts\":[{\"text\":\"" + prompt + "\"}]}]}";
        curl_easy_setopt(curl, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            response = "-ERR curl_easy_perform() failed: " + std::string(curl_easy_strerror(res));
        }
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    } else {
        response = "-ERR Failed to initialize curl.";
    }
    
    if (response.rfind("-ERR", 0) != 0) {
        update_config_and_db(response, cfg, db_ptr);
    }
    return response;
}

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
        std::ofstream f("config.json");
        if (f.is_open()) {
            f << "{\n  \"port\": " << cfg.port << ",\n  \"cache_size\": " << cfg.cache_size 
              << ",\n  \"cache_policy\": \"" << cfg.cache_policy << "\",\n  \"api_key\": \"" 
              << cfg.api_key << "\",\n  \"password\": \"" << cfg.password << "\",\n  \"cert_path\": \"" << cfg.cert_path << "\",\n  \"key_path\": \"" << cfg.key_path << "\"\n}";
            f.close();
        }
        std::lock_guard<std::mutex> lock(db_swap_mutex);
        db.reset(create_db(cfg.cache_policy, cfg.cache_size));
        std::cout << "[AI] DB reconfigured: policy=" << cfg.cache_policy << ", size=" << cfg.cache_size << std::endl;
    }
}

// Helper function to send a command to another node in the cluster
std::string send_command_to_node(const std::string& host, int port, const std::string& command, const std::string& password) {
    int sock = -1;
#ifdef _WIN32
    sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
#else
    sock = socket(AF_INET, SOCK_STREAM, 0);
#endif
    if (sock == -1) {
        return "-ERR Could not create socket to forward command.";
    }

    struct sockaddr_in server;
    server.sin_family = AF_INET;
    server.sin_port = htons(port);

#ifdef _WIN32
    server.sin_addr.s_addr = inet_addr(host.c_str());
#else
    inet_pton(AF_INET, host.c_str(), &server.sin_addr);
#endif

    if (connect(sock, (struct sockaddr*)&server, sizeof(server)) < 0) {
        return "-ERR Could not connect to target node.";
    }

    // Authenticate with the remote node
    std::string auth_command = "AUTH " + password + "\n";
    send(sock, auth_command.c_str(), auth_command.size(), 0);
    char auth_response_buffer[BUFFER_SIZE];
    int bytes_read = recv(sock, auth_response_buffer, BUFFER_SIZE - 1, 0);
    if (bytes_read <= 0 || std::string(auth_response_buffer, bytes_read).substr(0, 3) != "+OK") {
        return "-ERR Authentication failed on remote node.";
    }

    // Send the actual command
    std::string full_command = command + "\n";
    send(sock, full_command.c_str(), full_command.size(), 0);

    std::string response;
    char buffer[BUFFER_SIZE];
    while ((bytes_read = recv(sock, buffer, BUFFER_SIZE - 1, 0)) > 0) {
        buffer[bytes_read] = '\0';
        response += buffer;
        if (response.back() == '\n') break; // Assuming commands end with newline
    }

#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
    return response;
}

void handle_client(int client_sock, DB* db, const std::string& server_password, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr, SSL* ssl) {
    char buffer[BUFFER_SIZE];
    std::string cmd, key, value;
    bool authenticated = server_password.empty();

    while (true) {
        int bytes;
        if (ssl) {
            bytes = SSL_read(ssl, buffer, BUFFER_SIZE - 1);
        } else {
            bytes = recv(client_sock, buffer, BUFFER_SIZE - 1, 0);
        }
        if (bytes <= 0) {
            if (ssl) {
                int err = SSL_get_error(ssl, bytes);
                if (err == SSL_ERROR_ZERO_RETURN || err == SSL_ERROR_SYSCALL) {
                    // Connection closed or error
                } else {
                    ERR_print_errors_fp(stderr);
                }
            } else {
                // Non-SSL connection closed
            }
            break;
        }
        buffer[bytes] = '\0';
        std::istringstream iss(buffer);
        iss >> cmd;

        if (!authenticated) {
            if (cmd == "AUTH") {
                std::string client_password;
                iss >> client_password;
                if (client_password == server_password) {
                    authenticated = true;
                    write_response(client_sock, ssl, "+OK\n");
                } else {
                    write_response(client_sock, ssl, "-ERR Invalid password\n");
                }
            } else {
                write_response(client_sock, ssl, "-ERR Authentication required. Use AUTH <password>\n");
            }
            continue;
        }

        if (cmd == "SET") {
            iss >> key;
            if (key.empty()) {
                write_response(client_sock, ssl, "Usage: SET key value\n");
                continue;
            }
            iss >> std::ws;
            std::getline(iss, value);
            if (value.empty()) {
                write_response(client_sock, ssl, "Usage: SET key value\n");
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                write_response(client_sock, ssl, response + "\n");
            } else {
                db->set(key, value);
                write_response(client_sock, ssl, "+OK\n");
            }
        } else if (cmd == "GET") {
            iss >> key;
            if (key.empty()) {
                write_response(client_sock, ssl, "Usage: GET key\n");
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                write_response(client_sock, ssl, response + "\n");
            } else {
                if (db->get(key, value)) {
                    write_response(client_sock, ssl, value + "\n");
                } else {
                    write_response(client_sock, ssl, "(nil)\n");
                }
            }
        } else if (cmd == "DEL") {
            iss >> key;
            if (key.empty()) {
                write_response(client_sock, ssl, "Usage: DEL key\n");
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                write_response(client_sock, ssl, response + "\n");
            } else {
                db->del(key);
                write_response(client_sock, ssl, "+OK\n");
            }
        } else if (cmd == "LPUSH") {
            iss >> key;
            if (key.empty()) {
                write_response(client_sock, ssl, "Usage: LPUSH key value\n");
                continue;
            }
            iss >> std::ws;
            std::getline(iss, value);
            if (value.empty()) {
                write_response(client_sock, ssl, "Usage: LPUSH key value\n");
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                db->lpush(key, value);
                SSL_write(ssl, "+OK\n", 4);
            }
        } else if (cmd == "RPUSH") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: RPUSH key value\n", 23);
                continue;
            }
            iss >> std::ws;
            std::getline(iss, value);
            if (value.empty()) {
                SSL_write(ssl, "Usage: RPUSH key value\n", 23);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                db->rpush(key, value);
                SSL_write(ssl, "+OK\n", 4);
            }
        } else if (cmd == "LPOP") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: LPOP key\n", 16);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                if (db->lpop(key, value)) {
                    SSL_write(ssl, value.c_str(), value.size());
                    SSL_write(ssl, "\n", 1);
                } else {
                    SSL_write(ssl, "(nil)\n", 6);
                }
            }
        } else if (cmd == "RPOP") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: RPOP key\n", 16);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                if (db->rpop(key, value)) {
                    SSL_write(ssl, value.c_str(), value.size());
                    SSL_write(ssl, "\n", 1);
                } else {
                    SSL_write(ssl, "(nil)\n", 6);
                }
            }
        } else if (cmd == "LLEN") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: LLEN key\n", 16);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) { // Simple check, enhance for real cluster
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                size_t len = db->llen(key);
                SSL_write(ssl, std::to_string(len).c_str(), std::to_string(len).size());
                SSL_write(ssl, "\n", 1);
            }
        } else if (cmd == "HLL.ADD") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: HLL.ADD key element\n", 26);
                continue;
            }
            iss >> std::ws;
            std::getline(iss, value);
            if (value.empty()) {
                SSL_write(ssl, "Usage: HLL.ADD key element\n", 26);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) {
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                db->hll_add(key, value);
                SSL_write(ssl, "+OK\n", 4);
            }
        } else if (cmd == "HLL.COUNT") {
            iss >> key;
            if (key.empty()) {
                SSL_write(ssl, "Usage: HLL.COUNT key\n", 21);
                continue;
            }
            // Check if this key belongs to another node
            std::pair<std::string, int> target_node = cfg.cluster_manager.get_node(key);
            if (!target_node.first.empty() && (target_node.first != "127.0.0.1" || target_node.second != cfg.port)) {
                std::string response = send_command_to_node(target_node.first, target_node.second, buffer, server_password);
                SSL_write(ssl, response.c_str(), response.size());
                SSL_write(ssl, "\n", 1);
            } else {
                long long count = db->hll_count(key);
                SSL_write(ssl, std::to_string(count).c_str(), std::to_string(count).size());
                SSL_write(ssl, "\n", 1);
            }
        } else if (cmd == "EXPIRE") {
            int seconds;
            iss >> key >> seconds;
            if (key.empty() || !iss) {
                SSL_write(ssl, "Usage: EXPIRE key seconds\n", 26);
                continue;
            }
            db->expire(key, seconds);
            SSL_write(ssl, "+OK\n", 4);
        } else if (cmd == "SUBSCRIBE") {
            iss >> key; // key is the channel name
            if (key.empty()) {
                SSL_write(ssl, "Usage: SUBSCRIBE channel\n", 23);
                continue;
            }
            cfg.pubsub_manager->subscribe(key, client_sock);
            SSL_write(ssl, ("+OK Subscribed to " + key + "\n").c_str(), 14 + key.length());
        } else if (cmd == "PUBLISH") {
            iss >> key; // key is the channel name
            if (key.empty()) {
                SSL_write(ssl, "Usage: PUBLISH channel message\n", 27);
                continue;
            }
            iss >> std::ws;
            std::getline(iss, value); // value is the message
            if (value.empty()) {
                SSL_write(ssl, "Usage: PUBLISH channel message\n", 27);
                continue;
            }
            cfg.pubsub_manager->publish(key, value);
            SSL_write(ssl, ("+OK Published to " + key + "\n").c_str(), 13 + key.length());
        } else if (cmd == "SAVE") {
            db->save("db.json");
            SSL_write(ssl, "+OK\n", 4);
        } else if (cmd == "LOAD") {
            db->load("db.json");
            SSL_write(ssl, "+OK\n", 4);
        } else if (cmd == "AI_SUGGEST") {
            std::string suggestion = generate_and_apply_ai_suggestion(db, api_key, cfg, db_ptr);
            SSL_write(ssl, suggestion.c_str(), suggestion.size());
            SSL_write(ssl, "\n", 1);
        } else if (cmd == "QUIT") {
            break;
        } else {
            SSL_write(ssl, "Unknown command. Type HELP (if authenticated).\n", 47);
        }
    }

    if (ssl) {
        SSL_shutdown(ssl);
        SSL_free(ssl);
    }

#ifdef _WIN32
    closesocket(client_sock);
#else
    close(client_sock);
#endif
}

void ai_optimize_loop(DB* db, std::atomic<bool>& running, const std::string& api_key, ServerConfig& cfg, std::unique_ptr<DB>& db_ptr) {
    while (running) {
        std::this_thread::sleep_for(std::chrono::minutes(5));
        std::string suggestion = generate_and_apply_ai_suggestion(db, api_key, cfg, db_ptr);
        std::cout << "[AI Suggestion] " << suggestion << std::endl;
    }
}

int main() {
#ifdef _WIN32
    WSADATA wsa_data;
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
        std::cerr << "WSAStartup failed.\n";
        return 1;
    }
#endif

    ServerConfig cfg = read_config();

    // Initialize SSL (optional)
    SSL_CTX* ssl_ctx = nullptr;
    bool use_ssl = false;
    
    if (!cfg.cert_path.empty() && !cfg.key_path.empty()) {
        ssl_ctx = init_ssl_ctx();
        if (ssl_ctx) {
            try {
                load_certificates(ssl_ctx, cfg.cert_path, cfg.key_path);
                use_ssl = true;
                std::cout << "[INFO] SSL/TLS enabled with certificate: " << cfg.cert_path << std::endl;
            } catch (...) {
                std::cerr << "[WARNING] Failed to load SSL certificates. Running without SSL/TLS.\n";
                SSL_CTX_free(ssl_ctx);
                ssl_ctx = nullptr;
                use_ssl = false;
            }
        }
    } else {
        std::cout << "[INFO] SSL/TLS disabled (no certificate paths configured). Running in non-SSL mode.\n";
    }

    int server_fd = -1;
#ifdef _WIN32
    server_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
#else
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
#endif

    if (server_fd == -1) {
        std::cerr << "Could not create socket\n";
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    sockaddr_in server_addr{};
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(cfg.port);

    if (bind(server_fd, (sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        std::cerr << "Bind failed\n";
#ifdef _WIN32
        closesocket(server_fd);
        WSACleanup();
#else
        close(server_fd);
#endif
        return 1;
    }

    listen(server_fd, 10);
    std::cout << "Server listening on port " << cfg.port << std::endl;

    std::unique_ptr<DB> db(create_db(cfg.cache_policy, cfg.cache_size));
    
    // Try to load existing data, but don't crash if the file is empty or invalid
    try {
        db->load("db.json");
        std::cout << "[INFO] Database loaded from db.json" << std::endl;
    } catch (const std::exception& e) {
        std::cout << "[INFO] Starting with empty database (db.json was empty or invalid)" << std::endl;
    }

    std::atomic<bool> ai_loop_running(true);
    std::thread ai_thread(ai_optimize_loop, db.get(), std::ref(ai_loop_running), cfg.api_key, std::ref(cfg), std::ref(db));

    while (true) {
        int client_sock = accept(server_fd, nullptr, nullptr);
        if (client_sock < 0) {
            std::cerr << "Accept failed\n";
            continue;
        }

        SSL* ssl = nullptr;
        if (use_ssl && ssl_ctx) {
            ssl = SSL_new(ssl_ctx);
            SSL_set_fd(ssl, client_sock);
            if (SSL_accept(ssl) <= 0) {
                ERR_print_errors_fp(stderr);
                SSL_free(ssl);
#ifdef _WIN32
                closesocket(client_sock);
#else
                close(client_sock);
#endif
                continue;
            }
        }

        std::lock_guard<std::mutex> lock(db_swap_mutex);
        std::thread(handle_client, client_sock, db.get(), cfg.password, cfg.api_key, std::ref(cfg), std::ref(db), ssl).detach();
    }

    ai_loop_running = false;
    ai_thread.join();

    if (ssl_ctx) {
        SSL_CTX_free(ssl_ctx);
    }

#ifdef _WIN32
    closesocket(server_fd);
    WSACleanup();
#else
    close(server_fd);
#endif

    return 0;
}