import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import apiService from '@/services/api';
import type { ExerciseRankingsData, RankingFewestEntry, RankingEarliestEntry } from '@/types';

interface Props {
  guideNumber: number;
  exerciseNumber: number;
  refreshKey: number;
}

const MEDAL_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

function formatMargin(ms: number): string {
  if (ms < 0) return 'Fuera de plazo';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h antes`;
  if (hours > 0) return `${hours}h ${minutes}m antes`;
  return `${minutes}m antes`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <div className="w-6 h-6 bg-gray-200 rounded-full" />
      <div className="flex-1 h-4 bg-gray-200 rounded" />
      <div className="w-16 h-4 bg-gray-200 rounded" />
    </div>
  );
}

function RankingCard({ title, iconColor, children }: { title: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-white rounded-xl shadow border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className={`w-5 h-5 ${iconColor}`} />
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return <p className="text-sm text-gray-500 text-center py-4">Nadie ha resuelto este ejercicio aún</p>;
}

function RankRow({ rank, fullName, stat }: { rank: number; fullName: string; stat: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`text-lg font-bold w-6 text-center ${MEDAL_COLORS[rank] ?? 'text-gray-500'}`}>
        {rank}
      </span>
      <span className="flex-1 text-sm text-gray-700 truncate">{fullName}</span>
      <span className="text-sm font-semibold whitespace-nowrap">{stat}</span>
    </li>
  );
}

function FewestAttemptsCard({ entries }: { entries: RankingFewestEntry[] }) {
  return (
    <RankingCard title="TOP 5 — Menos intentos" iconColor="text-blue-500">
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => (
            <RankRow
              key={e.rank}
              rank={e.rank}
              fullName={e.fullName}
              stat={`${e.attempts} ${e.attempts === 1 ? 'intento' : 'intentos'}`}
            />
          ))}
        </ol>
      )}
    </RankingCard>
  );
}

function EarliestCompletionCard({ entries }: { entries: RankingEarliestEntry[] }) {
  return (
    <RankingCard title="TOP 5 — Primer solución exitosa" iconColor="text-purple-500">
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => (
            <RankRow key={e.rank} rank={e.rank} fullName={e.fullName} stat={formatMargin(e.marginMs)} />
          ))}
        </ol>
      )}
    </RankingCard>
  );
}

export default function ExerciseRankings({ guideNumber, exerciseNumber, refreshKey }: Props) {
  const [data, setData] = useState<ExerciseRankingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getExerciseRankings(guideNumber, exerciseNumber)
      .then((res) => {
        if (!cancelled && res.success && res.data) setData(res.data);
      })
      .catch(() => {/* silently ignore ranking errors */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [guideNumber, exerciseNumber, refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            {Array.from({ length: 5 }).map((_, j) => <SkeletonRow key={j} />)}
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <FewestAttemptsCard entries={data.fewestAttempts} />
      {data.hasDeadline && <EarliestCompletionCard entries={data.earliestCompletion} />}
    </div>
  );
}
