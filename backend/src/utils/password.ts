import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }

  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter." };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}
