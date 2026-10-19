# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-level React components responsible for rendering and user interaction, and use the shared API client for all relative `/api` requests. Every capability view must expose loading, accessible error, and meaningful empty states before rendering returned data; do not add authentication.
- Logic tier decision: Keep HTTP parsing/status codes in the Express router and put validation, persistence orchestration, scoring, and recommendations in `octofitService.ts`. Return deliberate 4xx responses for invalid input, malformed or missing references, and unknown users rather than leaking Mongoose cast errors as 500s.
- Data tier decision: Use Mongoose schemas as the persistence boundary. Require user identity and fitness goal; require team name and mascot with an empty members array by default; require activity type, user/team references, minutes, points, and occurrence date; and require workout focus, minutes, and difficulty. Keep the seed repeatable and non-destructive to unrelated records.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate that both IDs are valid and refer to existing records; compute points server-side at one point per minute; and store the references, type, minutes, points, and occurrence time.
- Team management approach: Reject a missing or blank name with `400`; preserve the submitted name and mascot; accept an optional members list of existing user IDs; and return the created/listed team with its member references.
- Leaderboard approach: Aggregate persisted activity points by team, include teams with no activity at zero, sort by total points descending, and assign 1-based ranks in the response.
- Workout suggestions approach: Resolve users by email and return a 4xx for an unknown address. Prefer workouts matching the user's fitness goal, using recent activity as a fallback signal; include a short reason for the first suggestion that names the matching goal or activity.
- Implementation order: Complete model constraints and data tests first; implement and test the service/API contract next; then connect the presentation views and verify their loading, error, empty, and populated states. Run both builds and the full suites after the tier-specific checks pass.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` checks required schema fields, defaults, references, and repeatable/non-destructive seeding. A failure points to persistence shape or seed behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend` checks activity/team creation and validation, leaderboard aggregation/ranking, and goal/activity-based workout suggestions. A failure points to service behavior or its HTTP contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend` checks API requests and populated, loading, empty, and accessible error states across all four routes. A failure points to presentation behavior or API-client integration.
- Backend build command: `npm run build --prefix octofit-tracker/backend` runs the TypeScript check; a failure indicates backend type or module errors.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` runs the TypeScript check and Vite production build; a failure indicates frontend type or bundling errors.
- Run order: data tests, API tests, frontend tests, then both builds. Once these focused checks pass, run `npm test --prefix octofit-tracker/backend` and `npm test --prefix octofit-tracker/frontend` as the final full-suite verification.
