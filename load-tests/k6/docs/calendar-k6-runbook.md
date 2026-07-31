# Calendar Load Testing Runbook

## Purpose

This runbook explains how to run calendar load tests, how to view results, and what to share with the team after each run.

Use this document for:
- calendar read load testing
- calendar event write load testing
- Docker-based execution
- result collection and reporting

## What is included

The project contains three k6 scenarios:
- `app`: Next.js app shell smoke check
- `calendar`: calendar GraphQL read load
- `write`: calendar event create, update, delete load

Main files:
- `load-tests/k6/run.js`
- `load-tests/k6/env/app-shell.env.example`
- `load-tests/k6/env/calendar-read.env.example`
- `load-tests/k6/env/calendar-write.env.example`
- `load-tests/k6/scenarios/app-shell-smoke.js`
- `load-tests/k6/scenarios/calendar-graphql-load.js`
- `load-tests/k6/scenarios/calendar-event-write-load.js`
- `load-tests/k6/results/`

## Prerequisites

A tester needs one of these:
- local `k6` installed
- Docker Desktop running

### Local k6 option

```bash
brew install k6
```

### Docker option

Start Docker Desktop:

```bash
open -a Docker
```

Confirm Docker is ready:

```bash
docker info
```

If `docker info` fails, the test runner cannot use Docker.

## First-time setup

From the project root, copy the environment templates:

```bash
cp load-tests/k6/env/app-shell.env.example load-tests/k6/env/app-shell.env
cp load-tests/k6/env/calendar-read.env.example load-tests/k6/env/calendar-read.env
cp load-tests/k6/env/calendar-write.env.example load-tests/k6/env/calendar-write.env
```

Then edit the copied files.

## Required environment values

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

## Standard commands

### App shell smoke

```bash
node load-tests/k6/run.js --scenario app --env-file load-tests/k6/env/app-shell.env
```

### Calendar read load

```bash
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

### Calendar write load

```bash
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

## Recommended staged test commands

### Staged read load

```bash
STAGES=10:1m,25:2m,50:3m,100:5m \
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

### Staged write load

```bash
STAGES=2:1m,5:2m,10:3m \
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

## How the runner works

The runner checks in this order:
1. use local `k6` if installed
2. otherwise use Docker with `grafana/k6`

No npm package is required for k6.

## Manual Docker commands

### Manual Docker: read load

```bash
docker run --rm -i \
  -v "$PWD:/work" \
  -w /work \
  --env-file load-tests/k6/env/calendar-read.env \
  grafana/k6:latest \
  run load-tests/k6/scenarios/calendar-graphql-load.js
```

### Manual Docker: write load

```bash
docker run --rm -i \
  -v "$PWD:/work" \
  -w /work \
  --env-file load-tests/k6/env/calendar-write.env \
  grafana/k6:latest \
  run load-tests/k6/scenarios/calendar-event-write-load.js
```

## How to save results

Create the results folder once:

```bash
mkdir -p load-tests/k6/results
```

Save a JSON summary:

```bash
K6_SUMMARY_EXPORT=load-tests/k6/results/calendar-read-summary.json \
node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
```

Another example for write load:

```bash
K6_SUMMARY_EXPORT=load-tests/k6/results/calendar-write-summary.json \
node load-tests/k6/run.js --scenario write --env-file load-tests/k6/env/calendar-write.env
```

## How to view results

### 1. Console summary

At the end of the run, k6 prints a summary in the terminal.

Important fields:
- `http_req_failed`
- `http_req_duration`
- `p(95)`
- `p(99)`
- iteration counts
- request counts

### 2. JSON summary file

If `K6_SUMMARY_EXPORT` is used, the JSON file is saved under:
- `load-tests/k6/results/`

Share these files with the team:
- summary JSON
- exact command used
- env profile used
- date and time of run

### 3. What to check first

For each run, review:
- failure rate
- p95 latency
- p99 latency
- whether the backend returned `500`
- whether the run completed all planned stages

## Suggested pass criteria

Initial baseline targets:
- `http_req_failed < 2%`
- `p95 < 2500 ms`
- `p99 < 5000 ms`

These are starting targets. Adjust after the first baseline run.

## Common issues

### Docker socket or daemon error

Example:

```text
failed to connect to the docker API ... docker.sock
```

Fix:

```bash
open -a Docker
docker info
```

Then run the same command again.

### HTML Internal Server Error in GraphQL runs

Example symptom:
- response body is HTML
- GraphQL endpoint returns `500 Internal Server Error`

Meaning:
- the test is running
- the backend is failing under that load or query mix

Action:
- reduce rate
- use staged ramp-up
- check backend logs
- compare read vs write behavior separately

### Wrong token or wrong GraphQL URL

Symptoms:
- all requests fail immediately
- no useful application data returns

Action:
- verify `ERP_GRAPHQL_URL`
- verify `ERP_AUTH_TOKEN`
- verify permissions for the test user

## Reporting template

Share the following after each run:

- Scenario: `app`, `calendar`, or `write`
- Environment: local, staging, or production-like
- Date and time: local timezone
- Command used: full command
- Env file used: exact file path
- Result file: JSON summary path
- Failure rate: value
- p95 latency: value
- p99 latency: value
- Main errors observed: short note
- Recommendation: increase load, reduce load, or investigate backend

## Example reporting message

```text
Scenario: calendar
Environment: staging
Date/Time: 2026-07-31 16:30 IST
Command: STAGES=10:1m,25:2m,50:3m,100:5m node load-tests/k6/run.js --scenario calendar --env-file load-tests/k6/env/calendar-read.env
Result file: load-tests/k6/results/calendar-read-summary.json
Failure rate: 1.2%
p95 latency: 1820 ms
p99 latency: 3410 ms
Main errors: intermittent ERP 500 above 80 arrivals/sec
Recommendation: backend investigation before increasing to 150 arrivals/sec
```

## Recommended test order

Run in this order:
1. app shell smoke
2. calendar read staged load
3. calendar write staged load
4. higher read load only after baseline is stable

## Notes for team leads

Use the same env file naming convention across teams where possible.

Keep these items with every test result:
- env file used
- command used
- JSON summary file
- short conclusion
