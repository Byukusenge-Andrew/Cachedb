#include "hyperloglog.h"
#include <limits>
#include <iostream>

// Simplified MurmurHash3_32 implementation (for illustration)
unsigned int murmur3_32(const void* key, int len, unsigned int seed) {
    const unsigned char* data = (const unsigned char*)key;
    const int nblocks = len / 4;

    unsigned int h1 = seed;

    const unsigned int c1 = 0xcc9e2d51;
    const unsigned int c2 = 0x1b873593;

    const unsigned int* blocks = (const unsigned int*)(data + nblocks * 4);

    for (int i = -nblocks; i; i++) {
        unsigned int k1 = blocks[i];

        k1 *= c1;
        k1 = (k1 << 15) | (k1 >> (32 - 15)); // ROTL32(k1, 15)
        k1 *= c2;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >> (32 - 13)); // ROTL32(h1, 13)
        h1 = h1 * 5 + 0xe6546b64;
    }

    const unsigned char* tail = (const unsigned char*)(data + nblocks * 4);

    unsigned int k1 = 0;

    switch (len & 3) {
        case 3: k1 ^= tail[2] << 16;
        case 2: k1 ^= tail[1] << 8;
        case 1: k1 ^= tail[0];
                k1 *= c1;
                k1 = (k1 << 15) | (k1 >> (32 - 15)); // ROTL32(k1, 15)
                k1 *= c2;
                h1 ^= k1;
    };

    h1 ^= len;

    h1 ^= h1 >> 16;
    h1 *= 0x85ebca6b;
    h1 ^= h1 >> 13;
    h1 *= 0xc2b2ae35;
    h1 ^= h1 >> 16;

    return h1;
}

HyperLogLog::HyperLogLog(unsigned int precision) : precision_(precision) {
    m_ = 1 << precision_;
    registers_.assign(m_, 0);
    alpha_m_ = get_alpha_m(m_);
}

void HyperLogLog::add(const std::string& element) {
    unsigned int hash = murmur3_32(element.data(), element.size(), 0); // Seed 0
    unsigned int k = get_k(hash);
    unsigned char rho = get_rho(hash, k);
    if (rho > registers_[k]) {
        registers_[k] = rho;
    }
}

long long HyperLogLog::count() {
    double sum_inverses = 0.0;
    for (unsigned char reg_val : registers_) {
        sum_inverses += 1.0 / (1 << reg_val);
    }
    double estimate = alpha_m_ * m_ * m_ / sum_inverses;

    // Apply corrections for small and large range estimates
    if (estimate <= 2.5 * m_) {
        unsigned int zero_registers = 0;
        for (unsigned char reg_val : registers_) {
            if (reg_val == 0) {
                zero_registers++;
            }
        }
        if (zero_registers != 0) {
            estimate = m_ * std::log(static_cast<double>(m_) / zero_registers);
        }
    }

    if (estimate > (1.0 / 30.0) * (1ULL << 32)) { // 2^32 is the max hash value
        estimate = -(1ULL << 32) * std::log(1.0 - estimate / (1ULL << 32));
    }

    return static_cast<long long>(estimate);
}

unsigned int HyperLogLog::get_k(unsigned int hash) {
    // The first 'precision_' bits of the hash determine the register index 'k'
    return hash >> (std::numeric_limits<unsigned int>::digits - precision_);
}

unsigned char HyperLogLog::get_rho(unsigned int hash, unsigned int k) {
    // The remaining bits (after the first 'precision_' bits) are used to find the position of the leftmost 1-bit
    unsigned int remaining_bits_mask = (1U << (std::numeric_limits<unsigned int>::digits - precision_)) - 1;
    unsigned int value = hash & remaining_bits_mask;
    
    if (value == 0) return std::numeric_limits<unsigned char>::max(); // All zeros, effectively infinite trailing zeros

    unsigned char rho = 1;
    while ((value & 1) == 0) {
        rho++;
        value >>= 1;
    }
    return rho;
}

double HyperLogLog::get_alpha_m(unsigned int m) {
    if (m == 16) return 0.673;
    if (m == 32) return 0.697;
    if (m == 64) return 0.709;
    return 0.7213 / (1.0 + 1.079 / m); // For m >= 128
} 