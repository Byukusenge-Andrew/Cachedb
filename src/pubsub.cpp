#include "pubsub.h"
#include <iostream>

#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <unistd.h>
#endif

PubSubManager::PubSubManager() {
    // Constructor: Initialize any necessary resources
}

PubSubManager::~PubSubManager() {
    // Destructor: Clean up resources if necessary
}

void PubSubManager::subscribe(const std::string& channel, int client_socket) {
    std::lock_guard<std::mutex> lock(mutex_);
    subscriptions_[channel].insert(client_socket);
    std::cout << "Client " << client_socket << " subscribed to channel: " << channel << std::endl;
}

void PubSubManager::unsubscribe(const std::string& channel, int client_socket) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = subscriptions_.find(channel);
    if (it != subscriptions_.end()) {
        it->second.erase(client_socket);
        if (it->second.empty()) {
            subscriptions_.erase(it);
        }
    }
    std::cout << "Client " << client_socket << " unsubscribed from channel: " << channel << std::endl;
}

void PubSubManager::publish(const std::string& channel, const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = subscriptions_.find(channel);
    if (it != subscriptions_.end()) {
        std::string full_message = "*PUBLISH " + channel + " " + message + "\n";
        for (int client_socket : it->second) {
            send_message_to_client(client_socket, full_message);
        }
    }
}

void PubSubManager::send_message_to_client(int client_socket, const std::string& message) {
    // This function assumes non-blocking sockets or handles potential blocking. 
    // For simplicity, using blocking send here. Consider threading/async for real-world.
    int bytes_sent = send(client_socket, message.c_str(), message.length(), 0);
    if (bytes_sent == -1) {
        std::cerr << "Error sending message to client " << client_socket << std::endl;
        // Potentially handle error (e.g., client disconnected) and remove from subscriptions
    }
} 