import { redis } from "./redis";

interface UserRecord {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

const USER_KEY = (id: string) => `user:${id}`;
const USERNAME_INDEX = (username: string) => `user:username:${username}`;

class UserStore {
  async createUser(username: string, password: string): Promise<UserRecord> {
    const existing = await this.findByUsername(username);
    if (existing) throw new Error("User already exists");

    const user: UserRecord = {
      id: crypto.randomUUID(),
      username,
      password,
      createdAt: new Date().toISOString(),
    };

    await redis
      .pipeline()
      .set(USER_KEY(user.id), JSON.stringify(user))
      .set(USERNAME_INDEX(username), user.id)
      .exec();

    return user;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const data = await redis.get(USER_KEY(id));
    return data ? JSON.parse(data) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const id = await redis.get(USERNAME_INDEX(username));
    if (!id) return null;
    return this.findById(id);
  }

  async verifyUser(
    username: string,
    password: string,
  ): Promise<UserRecord | null> {
    const user = await this.findByUsername(username);
    if (!user || user.password !== password) return null;
    return user;
  }
}

export const userStore = new UserStore();
export type { UserRecord };
