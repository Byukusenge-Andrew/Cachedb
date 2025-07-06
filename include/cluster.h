/*
 * cluster.h
 * Defines the ClusterManager class for distributed operation.
 */

#ifndef CLUSTER_H
#define CLUSTER_H

#include <string>
#include <vector>
#include <utility> // For std::pair
#include <functional> // For std::hash

class ClusterManager {
private:
    std::vector<std::pair<std::string, int>> nodes_; // host:port
    std::hash<std::string> hasher_;

public:
    ClusterManager();
    void add_node(const std::string& host, int port);
    void remove_node(const std::string& host, int port);
    std::pair<std::string, int> get_node(const std::string& key);
    const std::vector<std::pair<std::string, int>>& get_nodes() const { return nodes_; }
};

#endif // CLUSTER_H 