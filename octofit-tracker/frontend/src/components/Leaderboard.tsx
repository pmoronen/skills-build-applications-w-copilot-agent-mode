import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

function loadLeaderboard() {
  return getJson<LeaderboardResponse>('/api/leaderboard');
}

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      loadData={loadLeaderboard}
      emptyMessage="No leaderboard rankings yet."
      isEmpty={({ leaderboard }) => leaderboard.length === 0}
      renderData={({ leaderboard }) => (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
              <span>{entry.teamName}</span>
              <span>{entry.totalPoints} points</span>
            </li>
          ))}
        </ol>
      )}
    />
  );
}
