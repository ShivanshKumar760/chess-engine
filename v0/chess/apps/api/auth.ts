import { Elysia } from "elysia";
import { verifyJwt } from "./lib/jwt";

export const authPlugin = new Elysia({ name: "auth" })
  .derive(({ request }) => {
    const header = request.headers.get("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const user = token ? verifyJwt(token) : null;
    console.log(user);
    return { user };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .as("scoped");
