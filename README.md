# Planetscale Github Action

> Trigger, deploy, or delete a Planetscale branch via Github Actions.

Uses the [PlanetScale API](https://api-docs.planetscale.com/reference/getting-started-with-planetscale-api) to trigger, deploy, or delete a Planetscale branch via Github Actions.

## Usage

Create a GitHub Action Workflow file in your repository. Here are a few example workflows:

### Dev branch created or deleted

```yaml
# .github/workflows/ci-dev-branch.yml

name: Dev branch created or deleted

env:
  PLANETSCALE_ORG_NAME: ${{ secrets.PLANETSCALE_ORG_NAME }}
  PLANETSCALE_DB_NAME: ${{ secrets.PLANETSCALE_DB_NAME }}
  PLANETSCALE_SERVICE_TOKEN: ${{ secrets.PLANETSCALE_SERVICE_TOKEN }}
  PLANETSCALE_SERVICE_TOKEN_ID: ${{ secrets.PLANETSCALE_SERVICE_TOKEN_ID }}

on:
  push:
    branches-ignore:
      - main

jobs:
  create:
    name: Create Planetscale Dev Branch
    runs-on: ubuntu-latest
    if: ${{ github.event.create }}
    outputs:
      branch-name: ${{ steps.create-db-branch.outputs.branch-name }}
      connection-string: ${{ steps.create-db-branch.outputs.connection-string }}

    steps:
      - uses: actions/checkout@v3

      - name: Create db branch
        id: create-db-branch
        uses: barelylabs/planetscale-action@v0.1.3-alpha
        with:
          action: 'create-branch'
          overwrite-existing-branch: true
```

### Pull request opened/synced or closed.

```yaml
# .github/workflows/ci-pr.yml

name: pull request opened/synced or closed.

env:
  PLANETSCALE_ORG_NAME: ${{ secrets.PLANETSCALE_ORG_NAME }}
  PLANETSCALE_DB_NAME: ${{ secrets.PLANETSCALE_DB_NAME }}
  PLANETSCALE_SERVICE_TOKEN: ${{ secrets.PLANETSCALE_SERVICE_TOKEN }}
  PLANETSCALE_SERVICE_TOKEN_ID: ${{ secrets.PLANETSCALE_SERVICE_TOKEN_ID }}

on:
  pull_request:
    types: [opened, synchronize, closed]
    branches:
      - main

jobs:
  open:
    name: Create Planetscale Dev Branch
    runs-on: ubuntu-latest
    if: ${{ github.event.action == 'opened' || github.event.action == 'synchronize' }}
    outputs:
      branch-name: ${{ steps.create-db-branch.outputs.branch-name }}
      connection-string: ${{ steps.create-db-branch.outputs.connection-string }}

    steps:
      - uses: actions/checkout@v3

      - name: Create db branch
        id: create-db-branch
        uses: barelylabs/planetscale-action@v0.1.3-alpha
        with:
          action: 'create-branch'
          overwrite-existing-branch: true

  close:
    name: Delete Planetscale Dev Branch
    runs-on: ubuntu-latest
    if: ${{ github.event.action == 'closed'  }}

    steps:
      - uses: actions/checkout@v3

      - name: Delete db branch
        uses: barelylabs/planetscale-action@v0.1.3-alpha
        with:
          action: 'delete-branch'
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
