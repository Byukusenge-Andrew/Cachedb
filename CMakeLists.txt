cmake_minimum_required(VERSION 3.10)
project(mydb)
set(CMAKE_CXX_STANDARD 17)
include_directories(include)

# Find required packages
find_package(PkgConfig REQUIRED)
pkg_check_modules(CURL REQUIRED libcurl)

# Source files
set(COMMON_SOURCES
    src/db.cpp
    src/lru_cache.cpp
    src/lfu_cache.cpp
    src/data_types.cpp
    src/enhanced_cache.cpp
    src/protocol.cpp
    src/pubsub.cpp
)

# CLI client
add_executable(mydb src/main.cpp ${COMMON_SOURCES})
target_link_libraries(mydb ws2_32)

# Enhanced CLI client with full Redis-like commands
add_executable(mydb_enhanced src/enhanced_main.cpp ${COMMON_SOURCES})
target_link_libraries(mydb_enhanced ws2_32)

# Original server
add_executable(mydb_server src/server.cpp ${COMMON_SOURCES})
target_link_libraries(mydb_server ${CURL_LIBRARIES} ws2_32)
target_include_directories(mydb_server PRIVATE ${CURL_INCLUDE_DIRS})
target_compile_options(mydb_server PRIVATE ${CURL_CFLAGS_OTHER})

# Enhanced server with full Redis-like features
add_executable(mydb_enhanced_server src/enhanced_server.cpp ${COMMON_SOURCES})
target_link_libraries(mydb_enhanced_server ${CURL_LIBRARIES} ws2_32)
target_include_directories(mydb_enhanced_server PRIVATE ${CURL_INCLUDE_DIRS})
target_compile_options(mydb_enhanced_server PRIVATE ${CURL_CFLAGS_OTHER})
