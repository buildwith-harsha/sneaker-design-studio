import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
}

const getJwtSecret = (): Secret => {
  return process.env.JWT_SECRET || "sneaker_design_studio_jwt_secret_key_2026";
};

export function generateToken(userId: number): string {
  const options: SignOptions = {
    expiresIn: "7d",
  };
  return jwt.sign({ userId }, getJwtSecret(), options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
  if (!decoded || typeof decoded.userId !== "number") {
    throw new Error("Invalid token payload.");
  }
  return decoded;
}
