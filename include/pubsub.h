#pragma once

#include <string>
#include <vector>
#include <map>
#include <set>
#include <mutex>
#include <functional>
#include <thread>

// Forward declaration for client socket in server.cpp
class Server;

class PubSubManager {
public:
    PubSubManager();
    ~PubSubManager();

    void subscribe(const std::string& channel, int client_socket);
    void unsubscribe(const std::string& channel, int client_socket);
    void publish(const std::string& channel, const std::string& message);

private:
    std::map<std::string, std::set<int>> subscriptions_; // channel -> set of client sockets
    std::mutex mutex_;

    // Method to send messages to a specific client socket
    void send_message_to_client(int client_socket, const std::string& message);
}; 