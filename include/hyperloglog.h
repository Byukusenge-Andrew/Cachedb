#pragma once

#include <string>
#include <vector>
#include <cmath>
#include <algorithm>
#include <random>

// Using MurmurHash3 for hashing
// This is a simplified version and might need a proper MurmurHash3 implementation
// For this example, we'll use a basic hash and focus on the HLL algorithm
unsigned int murmur3_32(const void* key, int len, unsigned int seed);

class HyperLogLog {
public:
    HyperLogLog(unsigned int precision = 14); // precision m = 2^precision
    void add(const std::string& element);
    long long count();
    const std::vector<unsigned char>& get_registers() const {
        return registers_;
    }
    void set_registers(const std::vector<unsigned char>& new_registers) {
        registers_ = new_registers;
    }

private:
    unsigned int precision_;
    unsigned int m_; // 2^precision
    std::vector<unsigned char> registers_;
    double alpha_m_;

    unsigned int get_k(unsigned int hash);
    unsigned char get_rho(unsigned int hash, unsigned int k);
    double get_alpha_m(unsigned int m);
}; 