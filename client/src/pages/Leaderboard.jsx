import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  GraduationCap,
  Building,
  Target,
  TrendingUp,
  Award,
  AlertCircle,
  Activity,
  Flame,
  Crown
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Leaderboard = () => {
  // 1. REACT QUERY: FETCH LEADERBOARD DATA
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await api.get('/delegates/leaderboard');
      return response.data;
    }
  });

  const delegates = data?.data || [];
  
  // Split into Top 3 podium spots and remainder
  const podiumList = delegates.slice(0, 3);
  const secondaryList = delegates.slice(3);

  // Rearrange top 3 for classic podium display visual (2nd, 1st, 3rd)
  const visualPodium = [];
  if (podiumList[1]) visualPodium.push({ ...podiumList[1], rank: 2 });
  if (podiumList[0]) visualPodium.push({ ...podiumList[0], rank: 1 });
  if (podiumList[2]) visualPodium.push({ ...podiumList[2], rank: 3 });

  // Styles for gold, silver, bronze ranks
  const rankMeta = {
    1: {
      color: 'from-amber-400 to-yellow-500',
      text: 'text-amber-400',
      bg: 'bg-amber-950/20 border-amber-500/30',
      badge: '🏆 GOLD',
      glow: 'shadow-[0_0_25px_rgba(234,179,8,0.15)] border-amber-500/40 scale-105 z-10 md:translate-y-[-10px]',
      cardBg: 'bg-gradient-to-b from-amber-950/10 to-slate-950/40'
    },
    2: {
      color: 'from-slate-300 to-slate-400',
      text: 'text-slate-300',
      bg: 'bg-slate-900/30 border-slate-700/50',
      badge: '🥈 SILVER',
      glow: 'shadow-[0_0_20px_rgba(203,213,225,0.08)] border-slate-700/40 z-0',
      cardBg: 'bg-gradient-to-b from-slate-900/10 to-slate-950/40'
    },
    3: {
      color: 'from-amber-700 to-amber-800',
      text: 'text-amber-600',
      bg: 'bg-amber-950/10 border-amber-900/30',
      badge: '🥉 BRONZE',
      glow: 'shadow-[0_0_20px_rgba(180,83,9,0.08)] border-amber-900/30 z-0',
      cardBg: 'bg-gradient-to-b from-amber-900/5 to-slate-950/40'
    }
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-xs uppercase font-bold text-brand-400 tracking-wider flex items-center gap-1">
            <Flame size={14} className="text-brand-400 animate-pulse" />
            Competitive Arena
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Performance Leaderboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time rankings of campus delegates based on total lead conversions.
          </p>
        </div>
      </div>

      {/* Main Content Loading / Error Checks */}
      <div className="relative min-h-[400px] space-y-8">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 z-20">
            <svg className="animate-spin h-8 w-8 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400">Loading arena leaderboard...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-sm bg-slate-950/20 border border-slate-900 rounded-2xl">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <span>Failed to load rankings: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && delegates.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm bg-slate-950/20 border border-slate-900 rounded-2xl">
            <Trophy size={36} className="text-slate-800 mb-3" />
            <span>No campus delegates listed in the arena. Register delegates to start tracking stats.</span>
          </div>
        )}

        {!isLoading && !isError && delegates.length > 0 && (
          <>
            {/* Top 3 Podium Visual Container */}
            <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-6 pt-4">
              {visualPodium.map((delegate) => {
                const meta = rankMeta[delegate.rank];
                const assigned = delegate.assignedLeadsCount || 0;
                const converted = delegate.convertedLeadsCount || 0;
                const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                return (
                  <Card
                    key={delegate._id || delegate.id}
                    className={`
                      w-full md:w-80 p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden text-center border
                      ${meta.glow} ${meta.cardBg}
                    `}
                  >
                    {/* Atmospheric Podium Rank specific glowing bubble */}
                    <div className={`absolute top-0 left-1/2 translate-x-[-50%] w-28 h-28 bg-gradient-to-b ${meta.color} opacity-[0.03] blur-xl rounded-full`} />

                    <div className="flex flex-col items-center">
                      {/* Rank badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase border rounded-full px-3 py-1 ${meta.bg} ${meta.text}`}>
                        {delegate.rank === 1 && <Crown size={12} className="text-amber-400 mr-0.5 animate-bounce" />}
                        {meta.badge}
                      </span>

                      {/* Large profile picture initials avatar with colored ring */}
                      <div className="relative mt-5">
                        <div className={`w-20 h-20 rounded-full bg-slate-950 border-2 flex items-center justify-center text-xl font-black text-slate-200 shadow-glass border-slate-900`}>
                          {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                        </div>
                        {/* Ring highlight */}
                        <div className={`absolute inset-[-4px] rounded-full border bg-transparent opacity-40 pointer-events-none animate-pulse ${delegate.rank === 1 ? 'border-amber-400' : delegate.rank === 2 ? 'border-slate-400' : 'border-amber-700'}`} />
                      </div>

                      <h3 className="text-lg font-bold text-slate-200 mt-4 line-clamp-1">
                        {delegate.user?.name || 'Unknown Staff'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{delegate.user?.email || 'No email associated'}</p>

                      {/* Campus name / Code bubble */}
                      <div className="mt-4 p-3 bg-slate-900/60 border border-slate-900 rounded-xl space-y-1.5 w-full">
                        <div className="flex items-center justify-center gap-1.5 text-xs">
                          <Building size={13} className="text-slate-400" />
                          <span className="text-slate-300 font-semibold truncate max-w-[150px]">
                            {delegate.campus}
                          </span>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded bg-brand-950/80 border border-brand-500/20 text-[9px] font-bold text-brand-400 font-mono uppercase tracking-wider">
                          {delegate.code}
                        </span>
                      </div>
                    </div>

                    {/* Stats Metrics for podium */}
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-900">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Assigned</p>
                          <p className="text-base font-bold text-slate-300">{assigned}</p>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-900">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Converted</p>
                          <p className="text-base font-bold text-emerald-400">{converted}</p>
                        </div>
                      </div>

                      {/* Circular or Inline Progress bar */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 uppercase tracking-wide">Conversion Rate</span>
                          <span className="text-slate-300">{conversionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                              delegate.rank === 1 
                                ? 'from-amber-400 to-yellow-500' 
                                : delegate.rank === 2 
                                ? 'from-slate-300 to-slate-400' 
                                : 'from-amber-700 to-amber-800'
                            }`}
                            style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* List of remaining ranked delegates */}
            {secondaryList.length > 0 && (
              <Card className="p-0 border-slate-900 bg-slate-950/20 overflow-hidden text-left mt-8">
                <div className="p-5 border-b border-slate-900 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Award size={16} className="text-brand-400" />
                    Challengers Rankings
                  </h3>
                  <span className="text-[10px] font-bold uppercase bg-slate-900 text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
                    Rank 4 and below
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950/60">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-20">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Campus Delegate
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Campus & Code
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center w-32">
                          Assigned Leads
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center w-32">
                          Converted Leads
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right w-36">
                          Conversion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/50">
                      {secondaryList.map((delegate, index) => {
                        const rank = index + 4;
                        const assigned = delegate.assignedLeadsCount || 0;
                        const converted = delegate.convertedLeadsCount || 0;
                        const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                        return (
                          <tr
                            key={delegate._id || delegate.id}
                            className="hover:bg-slate-900/20 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 font-mono font-black text-slate-500 text-sm">
                              #{rank}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                                </div>
                                <div className="text-left space-y-0.5">
                                  <p className="text-sm font-bold text-slate-200 line-clamp-1">
                                    {delegate.user?.name || 'Unknown Staff'}
                                  </p>
                                  <p className="text-[10px] text-slate-500">{delegate.user?.email || 'No email'}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-left space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                  <Building size={12} className="text-slate-500" />
                                  <span className="font-medium truncate max-w-[150px]">{delegate.campus}</span>
                                </div>
                                <span className="inline-block text-[9px] font-bold text-slate-500 font-mono tracking-wider">
                                  {delegate.code}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center font-bold text-slate-400 text-sm">
                              {assigned}
                            </td>

                            <td className="px-6 py-4 text-center font-bold text-emerald-400 text-sm">
                              {converted}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <span className="text-xs font-bold text-slate-300 font-mono">{conversionRate}%</span>
                                <div className="w-20 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-brand-500"
                                    style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
