#pragma once
#include <string>
#include <vector>
#include <sstream>
#include <cstdint>

// Command parser for Redis-like protocol
class CommandParser {
public:
    struct Command {
        std::string name;
        std::vector<std::string> args;
    };
    
    static Command parse(const std::string& input);
    static std::string format_response(const std::string& response);
    static std::string format_error(const std::string& error);
    static std::string format_array(const std::vector<std::string>& array);
    static std::string format_integer(int64_t value);
    static std::string format_bulk_string(const std::string& str);
};

// Redis-like response formatter
class ResponseFormatter {
public:
    static std::string ok() { return "+OK\r\n"; }
    static std::string error(const std::string& msg) { return "-ERR " + msg + "\r\n"; }
    static std::string nil() { return "$-1\r\n"; }
    static std::string integer(int64_t value) { return ":" + std::to_string(value) + "\r\n"; }
    static std::string bulk_string(const std::string& str);
    static std::string array(const std::vector<std::string>& items);
};
