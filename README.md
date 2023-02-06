# Planetscale Github Action

> Trigger, deploy, or delete a Planetscale branch via Github Actions.

Uses the [PlanetScale API](https://api-docs.planetscale.com/reference/getting-started-with-planetscale-api) to trigger, deploy, or delete a Planetscale branch via Github Actions.

## Usage

Create a GitHub Action Workflow file in your repository following one of these examples.

### Standalone

```yaml
# .github/workflows/preview.yml

name: Preview Environment

env:
  VERCEL_ACCESS_TOKEN: ${{ secrets.VERCEL_ACCESS_TOKEN }}
  VERCEL_PROJECT_ID: <YOUR_VERCEL_PROJECT_ID>

on:
  pull_request:
    types: [opened, synchronize, closed]
    branches:
      - main

jobs:
  deploy:
    if: ${{ github.event.action == 'opened' || github.event.action == 'synchronize' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@v2
  delete:
    if: ${{ github.event.action == 'closed' }}
    runs-on: ubuntu-latest
    steps:
      - uses: snaplet/vercel-action@v2
        with:
          delete: true
```

## Documentation

### Prerequisites

[Get a service token for your database](https://planetscale.com/docs/concepts/service-tokens)

### Environment variables

- PLANETSCALE_ORG_NAME **[required]**
- PLANETSCALE_DB_NAME **[required]**
- PLANETSCALE_SERVICE_TOKEN_ID **[required]**
- PLANETSCALE_SERVICE_TOKEN **[required]**

### Inputs

```yaml
action:
  description: "accepts 'create-branch', 'open-deploy-request', 'queue-deploy-request', or 'delete-branch'"
  type: string
  required: true

parent-branch-name:
  description: 'The parent branch to create a new dev branch from, or merge current dev branch into. Defaults to main.'
  required: false
  type: string

branch-name:
  description: 'The name of the dev branch. Defaults to name of current git branch.'
  required: false
  type: string

overwrite-existing-branch:
  description: 'Whether to overwrite an existing dev branch. Defaults to false.'
  required: false
  type: boolean
  default: false
```

### Outputs

```yaml
branch-name:
  description: 'The name of the dev branch.'
  value: { { job.outputs.branch-name } }

branch-status:
  description: 'The status of the dev branch.'
  value: { { job.outputs.branch-status } }

connection-string:
  description: 'The connection string for the dev branch.'
  value: { { job.outputs.connection-string } }

deploy-request-number:
  description: 'The number of the deploy request.'
  value: { { job.outputs.deploy-request-number } }

deploy-request-state:
  description: 'The state of the deploy request.'
  value: { { job.outputs.deploy-request-state } }

deploy-request-deployment-state:
  description: 'The deployment state of the deploy request.'
  value: { { job.outputs.deploy-request-deployment-state } }
```
