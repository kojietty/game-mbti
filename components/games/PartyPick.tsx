"use client";

import { useState, useCallback } from "react";
import { scorePartyPick } from "@/lib/scoring";
import type { GameResult } from "@/lib/types";
import { SE } from "@/lib/sound";
import { GameShell } from "./GameShell";

interface Props {
  onComplete: (result: GameResult) => void;
}

interface Npc {
  id: string;
  name: string;
  role: string;
  combat: number;
  teamwork: number;
  desc: string;
}

const NPCS: Npc[] = [
  { id: "A", name: "Aria",   role: "アーチャー",  combat: 95, teamwork: 20, desc: "一流のソロハンター。仲間と距離を取りがち。" },
  { id: "B", name: "Krause", role: "魔法剣士",    combat: 92, teamwork: 25, desc: "圧倒的な火力。だが傲慢で仲間を見下す。" },
  { id: "C", name: "Beren",  role: "騎士",        combat: 70, teamwork: 75, desc: "平均的な戦闘力。誠実で頼れる。" },
  { id: "D", name: "Mira",   role: "ヒーラー",    combat: 65, teamwork: 85, desc: "中堅治癒師。献身的で仲間思い。" },
  { id: "E", name: "Lily",   role: "見習い",      combat: 40, teamwork: 90, desc: "駆け出しの治癒師。強い忠誠心を持つ。" },
  { id: "F", name: "Oz",     role: "諜報員",      combat: 45, teamwork: 80, desc: "戦闘は不得手。固い信頼関係を築ける。" },
];

const PICK_COUNT = 3;

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-[var(--color-muted)] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 text-right text-[var(--color-muted)]">{value}</span>
    </div>
  );
}

export function PartyPick({ onComplete }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const toggle = useCallback((id: string) => {
    if (confirmed) return;
    setSelected((prev) => {
      if (prev.includes(id)) {
        SE.tap();
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= PICK_COUNT) return prev;
      SE.tap();
      return [...prev, id];
    });
  }, [confirmed]);

  const handleConfirm = useCallback(() => {
    if (selected.length !== PICK_COUNT || confirmed) return;
    SE.success();
    setConfirmed(true);
    const { score, axisDeltas } = scorePartyPick({ pickedIds: selected });
    setTimeout(() => onComplete({
      gameId: "party-pick",
      score,
      durationMs: 0,
      rawData: { picked: selected },
      axisDeltas,
    }), 600);
  }, [selected, confirmed, onComplete]);

  return (
    <GameShell onRestart={() => { setSelected([]); setConfirmed(false); setStarted(false); }}>
      {() => (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 py-8">
          {!started ? (
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">パーティを編成せよ</p>
              <p className="text-sm text-[var(--color-muted)]">6 人の候補から 3 人を選べ。戦闘力か、チームワークか。</p>
              <button
                className="px-8 py-4 rounded-full bg-[var(--color-primary)] text-black font-black"
                onClick={() => setStarted(true)}
              >START</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--color-muted)] tracking-widest">
                {selected.length} / {PICK_COUNT} 選択中
              </p>

              {/* NPC grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {NPCS.map((npc) => {
                  const isSel = selected.includes(npc.id);
                  return (
                    <button
                      key={npc.id}
                      onClick={() => toggle(npc.id)}
                      className={`
                        card p-3 text-left rounded-xl transition-all active:scale-95
                        ${isSel ? "border-[var(--color-primary)] bg-cyan-950/30" : "hover:border-zinc-400"}
                        ${!isSel && selected.length >= PICK_COUNT ? "opacity-40 cursor-not-allowed" : ""}
                      `}
                      disabled={!isSel && selected.length >= PICK_COUNT}
                      aria-pressed={isSel}
                      aria-label={`${npc.name}, ${npc.role}, Combat ${npc.combat}, Teamwork ${npc.teamwork}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{npc.name}</span>
                        {isSel && <span className="text-[var(--color-primary)] text-xs">✓</span>}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] mb-2">{npc.role}</p>
                      <StatBar label="Combat"   value={npc.combat}   color="bg-cyan-400" />
                      <StatBar label="Teamwork" value={npc.teamwork} color="bg-fuchsia-300" />
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{npc.desc}</p>
                    </button>
                  );
                })}
              </div>

              <button
                className={`
                  px-8 py-4 rounded-full font-black text-lg transition-all
                  ${selected.length === PICK_COUNT
                    ? "bg-[var(--color-primary)] text-black active:scale-95"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed opacity-50"}
                `}
                onClick={handleConfirm}
                disabled={selected.length !== PICK_COUNT || confirmed}
              >
                {confirmed ? "確定済み ✓" : "CONFIRM"}
              </button>
            </>
          )}
        </div>
      )}
    </GameShell>
  );
}
