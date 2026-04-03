"use client";
import { useState, useCallback } from "react";
import { events } from "@repo/shared/events";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";
import { AuthForm } from "./components/AuthForm";
import { Lobby } from "./components/Lobby";
import { Game } from "./components/Game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type Screen = "auth" | "lobby" | "waiting" | "game";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function Home() {
  const { token, username, error, loading, authenticate, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const [screen, setScreen] = useState<Screen>("auth");
  const [gameId, setGameId] = useState<string | null>(null);
  const [fen, setFen] = useState(START_FEN);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [takebackRequest, setTakebackRequest] = useState(false);
  const [gameOver, setGameOver] = useState<{
    winner: string | null;
    reason: string;
  } | null>(null);

  const handleWsMessage = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      switch (type) {
        case events.createRoom: {
          setGameId(payload.gameId as string);
          setPlayerColor("white");
          setFen(START_FEN);
          setCurrentTurn("white");
          setGameOver(null);
          setMoveHistory([]);
          setLastMove(null);
          setScreen("waiting");
          break;
        }
        case events.joinRoom: {
          const incomingGameId = payload.gameId as string;
          setFen((payload.fen as string) || START_FEN);
          setCurrentTurn("white");
          setGameOver(null);
          setMoveHistory([]);
          setLastMove(null);
          setScreen("game");

          setGameId((prev) => {
            if (prev !== incomingGameId) {
              setPlayerColor("black");
            }
            return incomingGameId;
          });
          break;
        }
        case events.move: {
          setFen(payload.fen as string);
          setCurrentTurn(payload.currentTurn as "white" | "black");
          setLastMove({ from: payload.from as string, to: payload.to as string });
          if (payload.san) {
            setMoveHistory((prev) => [...prev, payload.san as string]);
          }

          // Play sound
          if (payload.inCheck) {
            new Audio("/sounds/notify.mp3").play().catch(() => {});
          } else if (payload.captured) {
            new Audio("/sounds/capture.mp3").play().catch(() => {});
          } else {
            new Audio("/sounds/move-self.mp3").play().catch(() => {});
          }

          if (payload.gameOver) {
            setGameOver({
              winner: payload.winner as string | null,
              reason: payload.endReason as string,
            });
          }
          break;
        }
        case events.resign: {
          setGameOver({
            winner: payload.winner as string | null,
            reason: "resign",
          });
          break;
        }
        case events.takebackRequest: {
          setTakebackRequest(true);
          break;
        }
        case events.takebackResponse: {
          // Takeback was declined — no action needed beyond clearing any pending state
          break;
        }
        case events.takebackApplied: {
          setFen(payload.fen as string);
          setCurrentTurn(payload.currentTurn as "white" | "black");
          setMoveHistory((prev) => prev.slice(0, -1));
          setLastMove(null);
          setTakebackRequest(false);
          break;
        }
        case "error": {
          console.error("Server error:", payload.message);
          break;
        }
      }
    },
    [],
  );

  const { connected, send } = useSocket(token, handleWsMessage);

  if (token && screen === "auth") {
    setScreen("lobby");
  }

  if (!token) {
    return <AuthForm onAuth={authenticate} loading={loading} error={error} />;
  }

  if (screen === "lobby") {
    return (
      <Lobby
        username={username!}
        connected={connected}
        onCreateRoom={() => send(events.createRoom)}
        onJoinRoom={(id) => send(events.joinRoom, { gameId: id })}
        onLogout={() => {
          logout();
          setScreen("auth");
        }}
      />
    );
  }

  if (screen === "waiting") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-sm">
          <Card className="glow-amber border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="animate-pulse-amber mb-2">
                <span
                  className="text-5xl select-none"
                  style={{
                    filter: "drop-shadow(0 0 20px oklch(0.78 0.12 75 / 30%))",
                  }}
                >
                  ♔
                </span>
              </div>
              <CardTitle className="text-xl">Waiting for opponent</CardTitle>
              <CardDescription>
                Share this room code with your opponent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room code display */}
              <div
                className="cursor-pointer rounded-lg border border-border/50 bg-background/50 p-4 text-center font-mono text-xs break-all text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                onClick={() => {
                  if (gameId) {
                    navigator.clipboard.writeText(gameId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {gameId}
              </div>

              <Button
                variant="secondary"
                className="h-11 w-full"
                size="lg"
                onClick={() => {
                  if (gameId) {
                    navigator.clipboard.writeText(gameId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {copied ? "Copied!" : "Copy Room Code"}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setScreen("lobby")}
              >
                Back to Lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (screen === "game" && gameId) {
    return (
      <Game
        gameId={gameId}
        fen={fen}
        playerColor={playerColor}
        currentTurn={currentTurn}
        moveHistory={moveHistory}
        lastMove={lastMove}
        takebackRequest={takebackRequest}
        gameOver={gameOver}
        onMove={(from, to, promotion) =>
          send(events.move, { gameId, from, to, promotion })
        }
        onResign={() => send(events.resign, { gameId })}
        onRequestTakeback={() => send(events.takebackRequest, { gameId })}
        onRespondTakeback={(accepted) => {
          send(events.takebackResponse, { gameId, accepted });
          setTakebackRequest(false);
        }}
        onBackToLobby={() => {
          setGameId(null);
          setGameOver(null);
          setScreen("lobby");
        }}
      />
    );
  }

  return null;
}
