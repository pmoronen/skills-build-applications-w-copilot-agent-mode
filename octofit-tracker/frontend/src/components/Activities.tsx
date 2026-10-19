import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

type ActivitiesResponse = { activities: ActivityRecord[] };

function loadActivities() {
  return getJson<ActivitiesResponse>('/api/activities');
}

export default function Activities() {
  return (
    <CapabilityCard<ActivitiesResponse>
      title="Activities"
      description="Track student activity minutes and points."
      loadData={loadActivities}
      emptyMessage="No activities yet."
      isEmpty={({ activities }) => activities.length === 0}
      renderData={({ activities }) => (
        <ul className="list-group">
          {activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
              {activity.type}: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    />
  );
}
