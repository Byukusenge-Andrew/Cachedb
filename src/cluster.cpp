/*
 * cluster.cpp
 * Implements the ClusterManager class for distributed operation.
 */

#include "cluster.h"
#include <algorithm>

ClusterManager::ClusterManager() {}

void ClusterManager::add_node(const std::string& host, int port) {
    nodes_.push_back({host, port});
}

void ClusterManager::remove_node(const std::string& host, int port) {
    nodes_.erase(std::remove_if(nodes_.begin(), nodes_.end(),
                                 [&](const std::pair<std::string, int>& node) {
                                     return node.first == host && node.second == port;
                                 }),
                  nodes_.end());
}

std::pair<std::string, int> ClusterManager::get_node(const std::string& key) {
    if (nodes_.empty()) {
        // Handle case with no nodes, or throw an exception
        return {"", 0}; 
    }
    size_t hash_val = hasher_(key);
    return nodes_[hash_val % nodes_.size()];
} 