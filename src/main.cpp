#include "db.h"
#include <iostream>
#include <memory>
#include <sstream>
#include <cctype>

// Helper to check if a string is an integer
bool is_integer(const std::string& s) {
    if (s.empty()) return false;
    size_t i = 0;
    if (s[0] == '-' || s[0] == '+') i = 1;
    for (; i < s.size(); ++i) if (!std::isdigit(s[i])) return false;
    return true;
}

int main() {
    std::unique_ptr<DB> db(new LRUDB(100));
    std::cout << "Welcome to MyDB! Type HELP for commands.\n";
    std::string line;
    while (std::cout << "> " && std::getline(std::cin, line)) {
        std::istringstream iss(line);
        std::string cmd, key, value;
        iss >> cmd;
        if (cmd == "SET") {
            iss >> key >> value;
            if (key.empty() || value.empty()) {
                std::cout << "Usage: SET key value\n";
                continue;
            }
            db->set(key, value);
            std::cout << "+OK\n";
        } else if (cmd == "GET") {
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: GET key\n";
                continue;
            }
            if (db->get(key, value)) {
                if (is_integer(value))
                    std::cout << ":" << value << "\n";
                else
                    std::cout << '"' << value << "\"\n";
            } else {
                std::cout << "(nil)\n";
            }
        } else if (cmd == "DEL") {
            iss >> key;
            if (key.empty()) {
                std::cout << "Usage: DEL key\n";
                continue;
            }
            db->del(key);
            std::cout << "+OK\n";
        } else if (cmd == "SAVE") {
            db->save("db.json");
            std::cout << "+SAVED\n";
        } else if (cmd == "LOAD") {
            db->load("db.json");
            std::cout << "+LOADED\n";
        } else if (cmd == "EXIT" || cmd == "QUIT") {
            break;
        } else if (cmd == "HELP") {
            std::cout << "Commands: SET key value | GET key | DEL key | SAVE | LOAD | EXIT\n";
        } else if (cmd.empty()) {
            continue;
        } else {
            std::cout << "Unknown command. Type HELP.\n";
        }
    }
    return 0;
}
