import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

const app = new Elysia({ adapter: node() }).get(
  "/",
  () => "Hello World let build apis!"
);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
