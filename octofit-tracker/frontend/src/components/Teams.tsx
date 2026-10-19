import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: TeamRecord[] };

function loadTeams() {
  return getJson<TeamsResponse>('/api/teams');
}

export default function Teams() {
  return (
    <CapabilityCard<TeamsResponse>
      title="Teams"
      description="Manage teams and members."
      loadData={loadTeams}
      emptyMessage="No teams yet."
      isEmpty={({ teams }) => teams.length === 0}
      renderData={({ teams }) => (
        <ul className="list-group">
          {teams.map((team) => (
            <li className="list-group-item" key={team.name}>
              <strong>{team.name}</strong> ({team.mascot})
              <div>Members: {team.members.join(', ') || 'None'}</div>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
