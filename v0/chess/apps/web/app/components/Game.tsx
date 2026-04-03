"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { Chess, type Square as ChessSquare } from "chess.js";
import { ChessiroCanvas, type Dests, type Square } from "chessiro-canvas";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameProps {
  gameId: string;
  fen: string;
  playerColor: "white" | "black";
  currentTurn: "white" | "black";
  moveHistory: string[];
  lastMove: { from: string; to: string } | null;
  takebackRequest: boolean;
  gameOver: { winner: string | null; reason: string } | null;
  onMove: (from: string, to: string, promotion?: string) => void;
  onResign: () => void;
  onRequestTakeback: () => void;
  onRespondTakeback: (accepted: boolean) => void;
  onBackToLobby: () => void;
}

const BOARD_THEME = {
  id: "obsidian-amber",
  name: "Obsidian Amber",
  darkSquare: "#7A6652",
  lightSquare: "#C8B898",
  lastMoveHighlight: "oklch(0.78 0.12 75 / 30%)",
  selectedPiece: "oklch(0.78 0.12 75 / 35%)",
};

export function Game({
  gameId,
  fen,
  playerColor,
  currentTurn,
  moveHistory,
  lastMove,
  takebackRequest,
  gameOver,
  onMove,
  onResign,
  onRequestTakeback,
  onRespondTakeback,
  onBackToLobby,
}: GameProps) {
  const isMyTurn = currentTurn === playerColor && !gameOver;
  const firedConfetti = useRef(false);
  const movesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moveHistory.length]);

  useEffect(() => {
    if (gameOver?.reason === "checkmate" && !firedConfetti.current) {
      firedConfetti.current = true;
      const end = Date.now() + 2500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (!gameOver) firedConfetti.current = false;
  }, [gameOver]);

  const chess = useMemo(() => new Chess(fen), [fen]);

  // Build legal move destinations map for chessiro-canvas
  const dests = useMemo<Dests>(() => {
    if (!isMyTurn) return new Map();
    const map = new Map<Square, Square[]>();
    const moves = chess.moves({ verbose: true });
    for (const move of moves) {
      const from = move.from as Square;
      const to = move.to as Square;
      const current = map.get(from);
      if (current) current.push(to);
      else map.set(from, [to]);
    }
    return map;
  }, [chess, isMyTurn]);

  const turnChar = chess.turn();
  const movableColor = isMyTurn ? turnChar : undefined;

  const chessiroLastMove = useMemo(
    () => (lastMove ? { from: lastMove.from as Square, to: lastMove.to as Square } : undefined),
    [lastMove],
  );

  const moveCount = chess.moveNumber();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 lg:flex-row lg:gap-6 lg:p-8">
      {/* Mobile top bar */}
      <div className="mb-3 flex w-full max-w-[min(90vw,560px)] items-center justify-between rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg select-none">
            {playerColor === "white" ? "♔" : "♚"}
          </span>
          <span className="text-sm font-medium capitalize text-foreground">
            {playerColor}
          </span>
        </div>
        <Badge
          variant={isMyTurn ? "default" : "secondary"}
          className={isMyTurn ? "" : "text-muted-foreground"}
        >
          {isMyTurn ? "Your turn" : "Waiting..."}
        </Badge>
      </div>

      {/* Board */}
      <div className="glow-amber w-full max-w-[min(90vw,560px)] overflow-hidden rounded-xl">
        <ChessiroCanvas
          position={fen}
          orientation={playerColor === "white" ? "white" : "black"}
          interactive={!gameOver}
          turnColor={turnChar}
          movableColor={movableColor}
          dests={dests}
          lastMove={chessiroLastMove}
          theme={BOARD_THEME}
          promotionVisuals={{
            backdropColor: "rgba(0, 0, 0, 0.7)",
            panelColor: "oklch(0.15 0.005 60 / 98%)",
            panelBorderColor: "oklch(0.78 0.12 75 / 25%)",
            panelShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            panelRadius: "12px",
            titleColor: "oklch(0.93 0.01 80)",
            optionBackground: "oklch(0.22 0.01 60)",
            optionBorderColor: "oklch(0.78 0.12 75 / 15%)",
            optionRadius: "8px",
          }}
          squareVisuals={{
            legalDot: "oklch(0.78 0.12 75 / 45%)",
            legalDotOutline: "oklch(0.93 0.01 80 / 60%)",
            legalCaptureRing: "oklch(0.78 0.12 75 / 55%)",
            selectedOutline: "oklch(0.78 0.12 75 / 80%)",
          }}
          onMove={(from, to, promotion) => {
            const localChess = new Chess(fen);
            const result = localChess.move({
              from,
              to,
              promotion: promotion ?? undefined,
            });
            if (!result) return false;
            onMove(from, to, result.promotion || undefined);
            return true;
          }}
        />
      </div>

      {/* Side panel */}
      <div className="mt-3 w-full max-w-[min(90vw,560px)] lg:mt-0 lg:w-72">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          {/* Desktop info */}
          <CardHeader className="hidden lg:block">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <span className="text-xl select-none">
                  {playerColor === "white" ? "♔" : "♚"}
                </span>
                <span className="capitalize">{playerColor}</span>
              </div>
              <Badge
                variant={isMyTurn ? "default" : "secondary"}
                className={isMyTurn ? "" : "text-muted-foreground"}
              >
                {isMyTurn ? "Your turn" : "Waiting..."}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Turn indicator bar */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-3 py-2.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isMyTurn
                    ? "bg-amber shadow-[0_0_8px_oklch(0.78_0.12_75)]"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {currentTurn === "white" ? "White" : "Black"} to move
              </span>
            </div>

            {/* Move history */}
            <div className="rounded-lg border border-border/50 bg-background/30">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  Moves
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {moveCount}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto p-2 lg:max-h-64">
                {moveHistory.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground/60">
                    No moves yet
                  </p>
                ) : (
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5">
                    {Array.from(
                      { length: Math.ceil(moveHistory.length / 2) },
                      (_, i) => {
                        const moveNum = i + 1;
                        const white = moveHistory[i * 2];
                        const black = moveHistory[i * 2 + 1];
                        const isLatest = i * 2 + 1 >= moveHistory.length - 1;
                        return (
                          <div key={moveNum} className="contents">
                            <span className="text-xs text-muted-foreground/50 font-mono pr-1 text-right">
                              {moveNum}.
                            </span>
                            <span
                              className={`text-xs font-mono px-1.5 py-0.5 rounded ${isLatest && !black ? "bg-amber/10 text-foreground" : "text-muted-foreground"}`}
                            >
                              {white}
                            </span>
                            <span
                              className={`text-xs font-mono px-1.5 py-0.5 rounded ${isLatest && black ? "bg-amber/10 text-foreground" : "text-muted-foreground"}`}
                            >
                              {black ?? ""}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
                <div ref={movesEndRef} />
              </div>
            </div>

            {/* Takeback request banner */}
            {takebackRequest && !gameOver && (
              <div className="rounded-lg border border-amber/30 bg-amber-muted p-3">
                <p className="text-sm font-medium text-foreground text-center mb-2">
                  Opponent requests a takeback
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="h-9 flex-1"
                    onClick={() => onRespondTakeback(true)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-9 flex-1"
                    onClick={() => onRespondTakeback(false)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {gameOver ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber/20 bg-amber-muted p-4 text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Game Over
                  </p>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {gameOver.reason}
                  </p>
                </div>
                <Button
                  onClick={onBackToLobby}
                  className="h-11 w-full font-semibold"
                  size="lg"
                >
                  Back to Lobby
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={onRequestTakeback}
                  className="h-10 flex-1"
                  size="lg"
                  disabled={moveHistory.length === 0}
                >
                  Undo
                </Button>
                <Button
                  variant="destructive"
                  onClick={onResign}
                  className="h-10 flex-1"
                  size="lg"
                >
                  Resign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
