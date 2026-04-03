import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import * as schema from "@repo/shared/zod-schema";
import { signJwt } from "./lib/jwt";
import { authPlugin } from "./auth";
import { userStore } from "@repo/db";
import { cors } from "@elysiajs/cors";

const app = new Elysia({ adapter: node() })
  .use(cors())
  .get("/", () => "Hello Elysia");

// Signup Route
app.post("/signup", async (req) => {
  const { success, data } = schema.signup.safeParse(req.body);
  if (!success) {
    return { error: "Invalid input" };
  }

  const existingUser = await userStore.findByUsername(data.username);
  if (existingUser) {
    return { error: "User already exists" };
  }

  await userStore.createUser(data.username, data.password);

  const token = signJwt({ email: data.username });

  return {
    message: "User signed up successfully!",
    data: {
      token,
    },
  };
});

// Login Route
app.post("/login", async (req) => {
  const { success, data } = schema.login.safeParse(req.body);
  if (!success) {
    return { error: "Invalid input" };
  }

  const user = await userStore.verifyUser(data.username, data.password);
  if (!user) {
    return { error: "Invalid credentials" };
  }

  const token = signJwt({ email: data.username });

  return {
    message: "User logged in successfully!",
    data: {
      token,
    },
  };
});

// Protected Routes (auth plugin must be .use()'d before accessing its context)
app.use(authPlugin).get("/protected", ({ user }) => {
  return {
    message: "This is a protected route!",
    user: user,
  };
});

app.listen(4000, () => {
  console.log("Server is running on http://localhost:4000");
});
