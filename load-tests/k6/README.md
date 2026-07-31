# k6 load testing for Calendar

This setup is for the team to load test the calendar without changing app code.

## Recommendation

Use **Grafana k6** for three separate purposes:

- **App shell smoke**: confirms Next.js stays reachable under light traffic
- **Calendar GraphQL read load**: measures the main calendar read bottlenecks
- **Calendar event write load**: measures event create, update, and delete load

For this app, the important load path is not just the HTML page. The heavier paths are:

- employee bootstrap
- role profile bootstrap
- customer bootstrap
- event range fetch
- event create/update/delete

## Files

- `load-tests/k6/run.js`
- `load-tests/k6/env/app-shell.env.example`
- `load-tests/k6/env/calendar-read.env.example`
- `load-tests/k6/env/calendar-write.env.example`
- `load-tests/k6/scenarios/app-shell-smoke.js`
- `load-tests/k6/scenarios/calendar-graphql-load.js`
- `load-tests/k6/scenarios/calendar-event-write-load.js`
- `load-tests/k6/lib/config.js`
- `load-tests/k6/lib/graphql.js`

## Do they need to install k6?

Not necessarily.

The runner supports:

1. **local k6 binary**
2. **Docker** with the official `grafana/k6` image

The runner will:

- use local `k6` if installed
- otherwise fall back to **Docker automatically**

So the team does **not** need an npm package for k6.

They need either:

- local `k6`, or
- Docker

If someone only sees Grafana in the browser, that does **not** mean they have a local execution engine. Browser access and local execution are different things.

## Prerequisites

Install either:

- **k6**
- or **Docker**

### Option 1: local k6

```bash
brew install k6
```

### Option 2: Docker

If Docker is installed, no local k6 install is required.

On macOS with Docker Desktop:

```bash
open -a Docker
```

Wait until Docker finishes starting, then verify:

```bash
docker info
```

If `docker info` fails, the runner will not be able to use Docker.

## Environment files

All envs live in separate files so each team can keep different names and values.

Templates:

- `load-tests/k6/env/app-shell.env.example`
- `load-tests/k6/env/calendar-read.env.example`
- `load-tests/k6/env/calendar-write.env.example`

Recommended workflow:

```bash
cp load-tests/k6/env/app-shell.env.example load-tests/k6/env/app-shell.env
cp load-tests/k6/env/calendar-read.env.example load-tests/k6/env/calendar-read.env
cp load-tests/k6/env/calendar-write.env.example load-tests/k6/env/calendar-write.env
```

Then edit those copied files for the target environment.

## How to run

## First-time setup

```bash
cp load-tests/k6/env/app-shell.env.example load-tests/k6/env/app-shell.env
cp load-tests/k6/env/calendar-read.env.example load-tests/k6/env/calendar-read.env
cp load-tests/k6/env/calendar-write.env.example load-tests/k6/env/calendar-write.env
```

Then edit the copied files with your real URLs, token, and test user values.

For a new tester, the normal commands are:

```bash
node load-tests/k6/run.js --scenario app --env-file load-tests/k6/env/app-shell.env
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

### 1. App shell smoke

```bash
node load-tests/k6/run.js --scenario app --env-file load-tests/k6/env/app-shell.env
```

### 2. Calendar read load

Example for **100 arrivals per second**:

```bash
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

### 3. Calendar write load

```bash
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

### npm shortcuts

These point to the example env files by default:

```bash
npm run k6:app-shell
npm run k6:calendar
npm run k6:calendar-write
```

If your team uses copied `.env` files instead of `.example`, use `node load-tests/k6/run.js ...` directly.

## Required environment variables

### App shell

```bash
APP_BASE_URL=http://localhost:3000
```

### Calendar read load

```bash
ERP_GRAPHQL_URL=https://your-erp-host/api/graphql
ERP_AUTH_TOKEN=your-frappe-token
```

### Calendar write load

```bash
ERP_GRAPHQL_URL=https://your-erp-host/api/graphql
ERP_AUTH_TOKEN=your-frappe-token
TEST_EMPLOYEE_ID=EMP-0001
TEST_EMPLOYEE_EMAIL=user@example.com
TEST_ROLE_PROFILE=BE1-CND-CH-CHE
```

## Configurable load settings

Shared:

```bash
RATE=100
DURATION=5m
PRE_ALLOCATED_VUS=50
MAX_VUS=300
SLEEP_SECONDS=0.2
```

Staged ramp-up profile:

```bash
STAGES=10:1m,25:2m,50:3m,100:5m
START_RATE=1
PRE_ALLOCATED_VUS=50
MAX_VUS=300
```

Rules:

- Use either `RATE` + `DURATION`, or `STAGES`
- `STAGES` format is `target:duration,target:duration`
- Example: `STAGES=10:1m,25:2m,50:3m`

Read scenario extras:

```bash
TEST_YEAR=2026
EVENT_PAGE_SIZE=500
EMPLOYEE_PAGE_SIZE=1000
ROLE_PAGE_SIZE=1000
CUSTOMER_PAGE_SIZE=500
```

Write scenario extras:

```bash
TEST_EVENT_CATEGORY=Meeting
TEST_EVENT_COLOR=#2563EB
TEST_EVENT_TYPE=Private
TEST_EVENT_DURATION_MINUTES=60
TEST_EVENT_PREFIX=K6 Load Test
```

## What each scenario does

### `app-shell-smoke.js`

Hits the Next.js shell only.

Use this to catch:

- app downtime
- proxy issues
- basic routing issues

### `calendar-graphql-load.js`

Setup phase:

1. fetch role profiles
2. fetch employees
3. fetch customers

Iteration phase:

1. fetch a random month event window inside the selected year

This matters because bootstrap data should not be multiplied by the per-second load rate.

### `calendar-event-write-load.js`

Each iteration performs:

1. create one event
2. update the same event
3. delete the same event

This isolates ERP write-path performance and avoids permanent test-data buildup.

## Suggested test progression

Do not start with `100/sec` immediately.

Run in this order:

1. `RATE=5 DURATION=1m`
2. `RATE=20 DURATION=2m`
3. `RATE=50 DURATION=3m`
4. `RATE=100 DURATION=5m`

If stable, then increase further.

Recommended staged read test:

```bash
STAGES=10:1m,25:2m,50:3m,100:5m \
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

Recommended staged write test:

```bash
STAGES=2:1m,5:2m,10:3m \
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

## Running with Docker

### Option A: use the repo runner

If Docker Desktop is running and local `k6` is not installed, this is enough:

```bash
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

The runner will:

- detect local `k6` first
- otherwise run `grafana/k6:latest` through Docker

### Option B: run Docker manually

Read scenario:

```bash
docker run --rm -i \
  -v "$PWD:/work" \
  -w /work \
  --env-file load-tests/k6/env/calendar-read.env \
  grafana/k6:latest \
  run load-tests/k6/scenarios/calendar-graphql-load.js
```

Write scenario:

```bash
docker run --rm -i \
  -v "$PWD:/work" \
  -w /work \
  --env-file load-tests/k6/env/calendar-write.env \
  grafana/k6:latest \
  run load-tests/k6/scenarios/calendar-event-write-load.js
```

App shell:

```bash
docker run --rm -i \
  -v "$PWD:/work" \
  -w /work \
  --env-file load-tests/k6/env/app-shell.env \
  grafana/k6:latest \
  run load-tests/k6/scenarios/app-shell-smoke.js
```

### Common Docker failure

If you see an error like:

```bash
failed to connect to the docker API ... docker.sock
```

it means Docker is installed but the daemon is not running.

Fix:

```bash
open -a Docker
docker info
```

Then rerun the test.

## Output and summaries

If you want to save the k6 summary:

```bash
K6_SUMMARY_EXPORT=load-tests/k6/results/calendar-read-summary.json \
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

Create the results folder first if you want to keep outputs in git-ignored local files:

```bash
mkdir -p load-tests/k6/results
```

## Team usage advice

- Use a dedicated staging ERP, not production
- Use a token with known permissions
- Use a dedicated employee/test user for write load
- Keep test data stable across runs
- Save k6 output JSON or console summaries per run for comparison
- Track `p95`, `p99`, failure rate, and ERP saturation

## Suggested success criteria

For a first baseline:

- `http_req_failed < 2%`
- `p95 < 2500ms`
- `p99 < 5000ms`

Adjust after the first baseline run.
