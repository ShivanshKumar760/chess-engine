import express from "express";
import http from "http";
import { initRabbit } from "./rabbit";
import { initWS } from "./ws";

const app = express();
const server = http.createServer(app);

app.get("/", (_, res) => res.send("Gateway running"));

const start = async () => {
  await initRabbit();
  initWS(server);
  server.listen(3000, () => {
    console.log("Gateway running on 3000");
  });
};

start();
