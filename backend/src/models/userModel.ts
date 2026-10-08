import type { AuthUser, User } from "../types/user.js";

export interface UserModelData {
  id: number;
  name: string;
  email: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export class UserModel {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;

  constructor(data: UserModelData) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password ?? "";
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  toJSON(): AuthUser {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
    };
  }

  toFullJSON(): User {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}
