"use client";

import { useEffect, useState } from "react";
import { onVisibilityChange } from "@/lib/visibility";
import { Button } from "@/components/ui/Button";

interface Props {
  children: (paused: boolean) => React.ReactNode;
  onRestart: () => void;
}

/**
 * Wraps a game component, detects tab switches, and shows a pause dialog.
 * Children receive `paused: boolean` so they can halt timers.
 */
export function GameShell({ children, onRestart }: Props) {
  const [paused, setPaused] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const cleanup = onVisibilityChange(
      () => {
        setPaused(true);
        setShowDialog(true);
      },
      () => {} // we wait for user to dismiss dialog
    );
    return cleanup;
  }, []);

  const handleContinue = () => {
    setShowDialog(false);
    setPaused(false);
  };

  const handleRestart = () => {
    setShowDialog(false);
    setPaused(false);
    onRestart();
  };

  return (
    <div className="relative">
      {children(paused)}

      {showDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-6">
          <div className="card p-8 flex flex-col items-center gap-6 max-w-xs w-full text-center">
            <p className="text-lg font-bold">戻ってきましたね</p>
            <p className="text-sm text-[var(--color-muted)]">
              ゲームを一時停止しました。
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleRestart}
              >
                やり直す
              </Button>
              <Button size="sm" fullWidth onClick={handleContinue}>
                続ける
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
