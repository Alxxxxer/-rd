import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Building, AlertCircle, Flame, Crown } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/common/Layout';
import Card from '../components/ui/Card';

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
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30',
      badge: '🏆 GOLD #1',
      barColor: 'bg-amber-500',
      cardBorder: 'border-amber-400/80 dark:border-amber-500/50 scale-[1.02] shadow-sm',
    },
    2: {
      color: 'text-zinc-500 dark:text-zinc-400',
      bg: 'bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800',
      badge: '🥈 SILVER #2',
      barColor: 'bg-zinc-400 dark:bg-zinc-500',
      cardBorder: 'border-zinc-300 dark:border-zinc-800 shadow-sm',
    },
    3: {
      color: 'text-orange-700 dark:text-orange-500',
      bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/10 dark:border-orange-900/20',
      badge: '🥉 BRONZE #3',
      barColor: 'bg-orange-600 dark:bg-orange-500',
      cardBorder: 'border-zinc-200 dark:border-zinc-800 shadow-sm',
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs uppercase font-bold text-brand-500 tracking-wider flex items-center gap-1.5">
            <Flame size={14} className="text-brand-500" />
            Competitive Arena
          </span>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
            Performance Leaderboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time rankings of campus delegates based on total lead conversions.
          </p>
        </div>
      </div>

      {/* Main Content Loading / Error Checks */}
      <div className="relative min-h-[400px] space-y-6">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 z-20 transition-colors duration-150">
            <svg className="animate-spin h-7 w-7 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading arena leaderboard...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <span>Failed to load rankings: {error?.message || 'Server connection error.'}</span>
          </div>
        )}

        {!isLoading && !isError && delegates.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-555 dark:text-zinc-400 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
            <Trophy size={32} className="text-zinc-300 dark:text-zinc-700 mb-2" />
            <span>No campus delegates listed in the arena. Register delegates to start tracking stats.</span>
          </div>
        )}

        {!isLoading && !isError && delegates.length > 0 && (
          <>
            {/* Top 3 Podium Visual */}
            <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-5 pt-2">
              {visualPodium.map((delegate) => {
                const meta = rankMeta[delegate.rank];
                const assigned = delegate.assignedLeadsCount || 0;
                const converted = delegate.convertedLeadsCount || 0;
                const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                return (
                  <Card
                    key={delegate._id || delegate.id}
                    className={`
                      w-full md:w-72 p-5 flex flex-col justify-between transition-all duration-150 text-center border bg-white dark:bg-zinc-900/40
                      ${meta.cardBorder}
                    `}
                  >
                    <div className="flex flex-col items-center">
                      {/* Rank badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase border rounded-full px-2.5 py-0.5 ${meta.bg} ${meta.color}`}>
                        {delegate.rank === 1 && <Crown size={10} className="text-amber-500 mr-0.5" />}
                        {meta.badge}
                      </span>

                      {/* avatar initials */}
                      <div className="mt-4">
                        <div className="w-16 h-16 rounded bg-zinc-150 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-700 dark:text-zinc-200">
                          {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-3.5 line-clamp-1">
                        {delegate.user?.name || 'Unknown Staff'}
                      </h3>
                      <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5 font-medium">{delegate.user?.email || 'No email associated'}</p>

                      {/* Campus Details */}
                      <div className="mt-3 p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded w-full space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-sm">
                          <Building size={14} className="text-zinc-400" />
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate max-w-[130px] leading-none">
                            {delegate.campus}
                          </span>
                        </div>
                        <span className="inline-block text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono uppercase tracking-wider">
                          {delegate.code}
                        </span>
                      </div>
                    </div>

                    {/* Stats Metrics */}
                    <div className="mt-5 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850">
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider font-bold">Assigned</p>
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{assigned}</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850">
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider font-bold">Converted</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{converted}</p>
                        </div>
                      </div>

                      {/* progress bar */}
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-zinc-450 dark:text-zinc-550 uppercase tracking-wide">Conversion Rate</span>
                          <span className="text-zinc-700 dark:text-zinc-300">{conversionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${meta.barColor}`}
                            style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Challengers table list */}
            {secondaryList.length > 0 && (
              <Card className="p-0 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 overflow-hidden text-left mt-6 shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={14} className="text-brand-500" />
                    Challengers Rankings
                  </h3>
                  <span className="text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-750 px-2.5 py-0.5 rounded">
                    Rank 4 and below
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-16 text-center">
                          Rank
                        </th>
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Campus Delegate
                        </th>
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Campus & Code
                        </th>
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center w-28">
                          Assigned
                        </th>
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center w-28">
                          Converted
                        </th>
                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right w-36">
                          Conversion Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {secondaryList.map((delegate, index) => {
                        const rank = index + 4;
                        const assigned = delegate.assignedLeadsCount || 0;
                        const converted = delegate.convertedLeadsCount || 0;
                        const conversionRate = assigned > 0 ? ((converted / assigned) * 100).toFixed(0) : '0';

                        return (
                          <tr
                            key={delegate._id || delegate.id}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/15 transition-colors duration-150"
                          >
                            <td className="px-5 py-4 text-center font-mono font-bold text-zinc-450 dark:text-zinc-500 text-sm">
                              #{rank}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-550 dark:text-zinc-400">
                                  {delegate.user?.name ? delegate.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'}
                                </div>
                                <div className="text-left space-y-0.5">
                                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 leading-tight">
                                    {delegate.user?.name || 'Unknown Staff'}
                                  </p>
                                  <p className="text-xs text-zinc-455 dark:text-zinc-500">{delegate.user?.email || 'No email'}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-left space-y-0.5 text-sm">
                                <div className="flex items-center gap-1 text-zinc-650 dark:text-zinc-300">
                                  <Building size={14} className="text-zinc-400" />
                                  <span className="font-semibold truncate max-w-[130px] leading-tight">{delegate.campus}</span>
                                </div>
                                <span className="inline-block text-[11px] font-bold text-brand-600 dark:text-brand-400 font-mono tracking-wider">
                                  {delegate.code}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-center font-bold text-zinc-500 dark:text-zinc-400 text-sm">
                              {assigned}
                            </td>

                            <td className="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              {converted}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                                <span>{conversionRate}%</span>
                                <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand-500"
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
