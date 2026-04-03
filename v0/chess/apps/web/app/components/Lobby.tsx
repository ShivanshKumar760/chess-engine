"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LobbyProps {
  username: string;
  connected: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (gameId: string) => void;
  onLogout: () => void;
}

export function Lobby({
  username,
  connected,
  onCreateRoom,
  onJoinRoom,
  onLogout,
}: LobbyProps) {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-[150px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <Card className="glow-amber border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl tracking-tight">
                <span className="text-2xl select-none" style={{ filter: "drop-shadow(0 0 12px oklch(0.78 0.12 75 / 30%))" }}>♛</span>
                Chess
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="max-w-28 truncate font-mono text-xs font-normal">
                  {username}
                </Badge>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onLogout}
                  className="text-muted-foreground"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  connected
                    ? "bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.15_155)]"
                    : "animate-pulse-amber bg-amber"
                }`}
              />
              <span className="text-muted-foreground">
                {connected ? "Connected" : "Connecting..."}
              </span>
            </div>

            {/* Create room */}
            <Button
              onClick={onCreateRoom}
              disabled={!connected}
              className="h-12 w-full text-sm font-semibold"
              size="lg"
            >
              <span className="mr-1.5 select-none">+</span>
              New Game
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">or join</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Join room */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Paste room code"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="h-11 flex-1 bg-background/50 font-mono text-sm"
              />
              <Button
                onClick={() => joinId && onJoinRoom(joinId)}
                disabled={!connected || !joinId}
                variant="secondary"
                className="h-11 px-5"
                size="lg"
              >
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
