const API_BASE = "/api";

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string | null;
}

async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// Auth
export const register = (username: string, email: string, password: string) =>
  apiCall<{ token: string; user: any }>("/auth/register", {
    method: "POST",
    body: { username, email, password },
  });

export const login = (email: string, password: string) =>
  apiCall<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const getProfile = (token: string) =>
  apiCall<{ user: any }>("/auth/me", { token });

// Game
export const createGame = (token: string) =>
  apiCall<{ gameId: string; whitePlayer: string }>("/game/create", {
    method: "POST",
    token,
  });

export const joinGame = (token: string, gameId: string) =>
  apiCall<{ gameId: string; whitePlayer: string; blackPlayer: string }>(
    `/game/join/${gameId}`,
    {
      method: "POST",
      token,
    }
  );

export const getGameHistory = (token: string) =>
  apiCall<{ games: any[] }>("/game/history", { token });

export const getGameDetails = (token: string, gameId: string) =>
  apiCall<any>(`/game/${gameId}`, { token });

// Leaderboard
export const getLeaderboard = () =>
  apiCall<{ leaderboard: any[] }>("/leaderboard");

// WebSocket
export const createGameSocket = (token: string): WebSocket => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/game-ws?token=${token}`);
};
