import { getInput } from "@actions/core"
import { context } from "@actions/github"

import * as fs from 'fs';

async function main() {
  const reviewTeams = getReviewTeams();
  console.log(reviewTeams);

  // selectRandomReviewer()
}

function selectRandomReviewer() {
  const prCreator = context.payload.pull_request?.user.login;

  console.log(prCreator);
}

function getReviewTeams() {
  const codeownersFile = fs.readFileSync('./.github/CODEOWNERS', 'utf8');
  const lines = codeownersFile.split('\n');
  const changedFiles = getInput("changed_files").replace(/"/g, '').split(",");

  const teamMap = new Map<string, string>();
  lines.forEach(line => {
    const [pattern, team] = line.trim().split(/\s+/);
    if (pattern && team) {
      teamMap.set(pattern, team);
    }
  });

  const responsibleTeams = new Set<string>();
  changedFiles.forEach(file => {
    teamMap.forEach((team, pattern) => {
      const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
      if (regex.test(file)) {
        responsibleTeams.add(team);
      }
    });
  });

  return Array.from(responsibleTeams);
}

main()
