# github-actions

A GitHub Actions repository for automating code review assignments based on CODEOWNERS configuration.

## Features

- Automatic reviewer assignment based on changed files
- Team-based code ownership using CODEOWNERS
- Random reviewer selection from eligible team members

## Prerequisites

Before setting up this project locally, ensure you have the following installed:

- **Node.js**: Version 20 or higher ([Download](https://nodejs.org/))
- **Bun**: Latest version ([Installation guide](https://bun.sh/docs/installation))
- **Git**: For version control ([Download](https://git-scm.com/downloads))
- **GitHub Account**: With access to create Personal Access Tokens

## Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/dev-soon/github-actions.git
cd github-actions
```

### 2. Install Dependencies

This project uses Bun as the package manager:

```bash
bun install
```

Alternatively, if you prefer npm:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.secrets` file in the root directory by copying the example file:

```bash
cp .secrets.example .secrets
```

Edit the `.secrets` file and add your GitHub Personal Access Token:

```
PERSONAL_ACCESS_TOKEN=ghp_your_actual_token_here
```

#### How to Create a GitHub Personal Access Token:

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a descriptive name (e.g., "GitHub Actions Local Dev")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership, read org projects)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

**Important**: Never commit the `.secrets` file to version control. It's already included in `.gitignore`.

### 4. Build the Project

Compile the TypeScript code to JavaScript:

```bash
bun run build
```

This will compile all TypeScript files according to the `tsconfig.json` configuration.

### 5. Set Up CODEOWNERS

The project uses a `.github/CODEOWNERS` file to define code ownership. The format is:

```
<file-pattern> <@org/team-name>
```

Example:
```
*.md @dev-soon/docs-reviewers
*.ts @dev-soon/code-reviewers
```

Ensure your teams exist in your GitHub organization before using them in CODEOWNERS.

## Verification

To verify your local setup is working correctly:

### 1. Check TypeScript Compilation

```bash
bun run build
```

Expected output: No errors, compiled `.js` files should appear in `.github/actions/assign-reviewer/`

### 2. Verify Dependencies

```bash
bun --version
node --version
```

Expected output:
- Bun version should be displayed
- Node version should be 20.x or higher

### 3. Test the Action Locally

You can run the assign-reviewer action locally:

```bash
bun run assign-reviewer
```

**Note**: This will fail without proper GitHub context (pull request event), but it verifies the script can be loaded and executed.

## Project Structure

```
.
├── .github/
│   ├── actions/
│   │   └── assign-reviewer/
│   │       ├── action.yml        # Action metadata
│   │       └── action.ts         # Main action logic
│   ├── workflows/
│   │   ├── assign-reviewer.yml   # Workflow that uses the action
│   │   ├── claude-code-review.yml
│   │   └── claude.yml
│   ├── CODEOWNERS                # Code ownership configuration
│   └── slack.yml
├── .secrets.example              # Example environment variables file
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md
```

## Available Scripts

- `bun run build` - Compile TypeScript to JavaScript
- `bun run assign-reviewer` - Run the assign-reviewer action locally
- `bun test` - Run tests (currently not configured)

## How It Works

1. When a pull request is opened or updated, the `assign-reviewer` workflow triggers
2. The workflow detects which files were changed
3. It reads the CODEOWNERS file to determine which teams own the changed files
4. For each responsible team, it randomly selects an eligible reviewer (excluding the PR author)
5. The selected reviewers are assigned to the pull request

## Troubleshooting

### Build Errors

If you encounter TypeScript compilation errors:
- Ensure you're using Node.js 20 or higher
- Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`

### Permission Errors

If the action fails with permission errors:
- Verify your `PERSONAL_ACCESS_TOKEN` has the correct scopes
- Ensure the token hasn't expired
- Check that your GitHub organization allows the token to access team information

### CODEOWNERS Not Working

If reviewers aren't being assigned correctly:
- Verify team names in CODEOWNERS match your GitHub organization teams
- Ensure teams have at least one member besides the PR author
- Check that file patterns in CODEOWNERS are correct

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## License

ISC
