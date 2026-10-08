import { UserRepository } from "../repositories/userRepository.js";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import type { AuthResponse, AuthUser, LoginUser } from "../types/user.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  private userRepository = new UserRepository();

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const trimmedName = (name || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error("Name must be at least 2 characters long.");
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error("Please provide a valid email address.");
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || "Invalid password.");
    }

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new Error("Email is already registered.");
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.userRepository.create(
      trimmedName,
      normalizedEmail,
      hashedPassword,
    );

    const token = generateToken(user.id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async login(credentials: LoginUser): Promise<AuthResponse> {
    const normalizedEmail = (credentials?.email || "").trim().toLowerCase();
    const password = credentials?.password || "";

    if (!normalizedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const passwordMatches = await comparePassword(password, user.password);

    if (!passwordMatches) {
      throw new Error("Invalid email or password.");
    }

    const token = generateToken(user.id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async getMe(userId: number): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    return user.toJSON();
  }
}
