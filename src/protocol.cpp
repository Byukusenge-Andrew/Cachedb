#include "protocol.h"
#include <algorithm>
#include <cstdint>

CommandParser::Command CommandParser::parse(const std::string& input) {
    Command cmd;
    std::istringstream iss(input);
    std::string token;
    
    // Parse command and arguments
    if (iss >> token) {
        cmd.name = token;
        std::transform(cmd.name.begin(), cmd.name.end(), cmd.name.begin(), ::toupper);
        
        // Parse remaining arguments
        while (iss >> token) {
            cmd.args.push_back(token);
        }
    }
    
    return cmd;
}

std::string CommandParser::format_response(const std::string& response) {
    return response + "\r\n";
}

std::string CommandParser::format_error(const std::string& error) {
    return "-ERR " + error + "\r\n";
}

std::string CommandParser::format_array(const std::vector<std::string>& array) {
    std::string result = "*" + std::to_string(array.size()) + "\r\n";
    for (const auto& item : array) {
        result += "$" + std::to_string(item.length()) + "\r\n" + item + "\r\n";
    }
    return result;
}

std::string CommandParser::format_integer(int64_t value) {
    return ":" + std::to_string(value) + "\r\n";
}

std::string CommandParser::format_bulk_string(const std::string& str) {
    return "$" + std::to_string(str.length()) + "\r\n" + str + "\r\n";
}

std::string ResponseFormatter::bulk_string(const std::string& str) {
    if (str.empty()) {
        return "$0\r\n\r\n";
    }
    return "$" + std::to_string(str.length()) + "\r\n" + str + "\r\n";
}

std::string ResponseFormatter::array(const std::vector<std::string>& items) {
    std::string result = "*" + std::to_string(items.size()) + "\r\n";
    for (const auto& item : items) {
        result += bulk_string(item);
    }
    return result;
}
