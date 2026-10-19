import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity payload must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !/^[\da-f]{24}$/i.test(userId)
    || typeof teamId !== 'string' || !/^[\da-f]{24}$/i.test(teamId)
    || typeof type !== 'string' || !type.trim()
    || typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1
  ) {
    throw Object.assign(new Error('Activity fields are invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(new Types.ObjectId(userId)),
    Team.findById(new Types.ObjectId(teamId)),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team payload must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }
  if (!Array.isArray(members) || !members.every((member) => typeof member === 'string' && /^[\da-f]{24}$/i.test(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])].map((memberId) => new Types.ObjectId(memberId));
  const existingMembers = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select('_id')
    : [];
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length) {
    await Promise.all([
      Team.updateMany(
        { _id: { $ne: team._id }, members: { $in: memberIds } },
        { $pull: { members: { $in: memberIds } } },
      ),
      User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } }),
    ]);
  }
  return team;
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function normalizeFocus(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function focusForActivity(type: string) {
  const normalizedType = normalizeFocus(type);
  if (/run|running|cycle|cycling|walk|walking|cardio|endurance/.test(normalizedType)) return 'endurance';
  if (/strength|weight/.test(normalizedType)) return 'strength';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
  ]);
  const goalFocus = normalizeFocus(user.fitnessGoal);
  let matchingWorkouts = workouts.filter((workout) => normalizeFocus(workout.focus) === goalFocus);
  let reason = `Matches your ${user.fitnessGoal} fitness goal.`;

  if (!matchingWorkouts.length && recentActivities.length) {
    const recentActivity = recentActivities[0];
    const activityFocus = focusForActivity(recentActivity.type);
    matchingWorkouts = workouts.filter((workout) => normalizeFocus(workout.focus) === activityFocus);
    reason = `Based on your recent ${recentActivity.type} activity.`;
  }

  return matchingWorkouts.map((workout) => ({ ...workout, reason }));
}

export { User };
