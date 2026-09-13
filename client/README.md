# Client — Track Manager

Task 2. Angular front-end for the Track Management API.

## Prerequisites

- Node.js 20+ (built on 24.x)
- The API running on `http://localhost:5229` — see the [root README](../README.md)

The API's CORS policy already allows `http://localhost:4200`, so no proxy is needed.

## Run

```bash
npm install
npm start
```

Then open `http://localhost:4200`.

| Command | Does |
|---|---|
| `npm start` | Dev server on :4200 |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Vitest) |

## Sign in

Every API endpoint requires authentication, including reads, so the app signs in before it can
render anything. Development accounts:

| Username | Password | Role |
|---|---|---|
| `distributor` | `Distributor#123` | Full access |
| `viewer` | `Viewer#123` | Read-only |

## Configuration

The API base URL lives in `src/environments/` — `environment.development.ts` for `ng serve`,
`environment.ts` for a production build. Nothing else is environment-dependent.

## Stack

Angular 21, standalone components, **zoneless** change detection, signals for state (no NgRx),
typed reactive forms, hand-rolled SCSS with CSS custom-property tokens (no UI library), Vitest.
