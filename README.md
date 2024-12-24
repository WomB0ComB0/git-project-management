# GitHub Project Management Automation

A TypeScript tool to automate GitHub project management using the GitHub API (REST + GraphQL).

## Features

- Creates project boards with GitHub Projects V2
- Generates milestones for project phases
- Creates issues with proper labeling and assignments
- Automatically creates feature branches
- Links issues to project boards
- Handles existing resources gracefully

## Prerequisites

- [Bun](https://bun.sh) runtime
- GitHub Personal Access Token with these permissions:
  - `repo` (Full control of private repositories)
  - `project` (Full control of projects)
  - `admin:org` (Full control of orgs and teams)

## Setup

1. Clone the repository

2. Create a `.env` file with:

  ```bash
  GITHUB_TOKEN_D=your_github_token
  REPO_OWNER=your_username_or_org
  REPO_NAME=your_repository_name
  ```

3. Install dependencies:

  ```bash
  bun install
  ```

4. Configure your project plan in `constants.ts`

## Usage

Run the automation:

```bash
bun run index.ts
```

## Project Structure

- `index.ts` - Main automation logic
- `constants.ts` - Project plan configuration
- `types.ts` - TypeScript type definitions
- `env.d.ts` - Environment variable types

## Error Handling

The tool includes comprehensive error handling for:

- Existing resources
- API rate limits
- Permission issues
- Network errors

## License

MIT
