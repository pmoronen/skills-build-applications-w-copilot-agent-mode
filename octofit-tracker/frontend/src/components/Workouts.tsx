import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; reason: string };
type WorkoutsResponse = { suggestions: WorkoutSuggestion[] };

const userEmail = 'mona@example.com';

function loadWorkouts() {
  return getJson<WorkoutsResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
}

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutsResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadData={loadWorkouts}
      emptyMessage="No workout suggestions yet."
      isEmpty={({ suggestions }) => suggestions.length === 0}
      renderData={({ suggestions }) => (
        <ul className="list-group">
          {suggestions.map((suggestion) => (
            <li className="list-group-item" key={suggestion.title}>
              <strong>{suggestion.title}</strong>
              <div>{suggestion.focus} | {suggestion.minutes} minutes</div>
              <div>{suggestion.reason}</div>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
