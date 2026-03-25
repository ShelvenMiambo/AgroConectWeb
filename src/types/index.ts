// src/types/index.ts

// User Interface
export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

// Authentication Response Interface
export interface AuthResponse {
    token: string;
    user: User;
}

// Login Request Interface
export interface LoginRequest {
    username: string;
    password: string;
}

// Other Authentication Related Types
export type AuthStatus = 'logged_in' | 'logged_out';
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}