#ifndef PROJECT_MANAGER_H
#define PROJECT_MANAGER_H

#include "db.h"
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <mutex>
#include <nlohmann/json.hpp>

// Forward declaration
class DB;

class ProjectManager {
public:
    ProjectManager(const std::string& data_root);
    ~ProjectManager();

    bool project_exists(const std::string& project_name);
    bool create_project(const std::string& project_name);
    bool drop_project(const std::string& project_name);
    std::vector<std::string> list_projects();

    bool database_exists(const std::string& project_name, const std::string& db_name);
    bool create_database(const std::string& project_name, const std::string& db_name, const std::string& policy, int size);
    bool drop_database(const std::string& project_name, const std::string& db_name);
    std::vector<std::string> list_databases(const std::string& project_name);
    nlohmann::json get_database_stats(const std::string& project_name, const std::string& db_name);


    DB* get_database(const std::string& project_name, const std::string& db_name);
    
    void load_all();
    void save_all();

private:
    struct Project {
        std::map<std::string, std::unique_ptr<DB>> databases;
        std::mutex mtx;
    };

    std::map<std::string, std::unique_ptr<Project>> projects_;
    std::string data_root_;
    std::mutex projects_mtx_;

    void save_database(const std::string& project_name, const std::string& db_name);
    void load_database(const std::string& project_name, const std::string& db_path);
};

#endif // PROJECT_MANAGER_H 