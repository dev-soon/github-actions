import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import * as fs from 'fs';

async function main() {
  try {
    const reviewers = await selectRandomReviewer();
    console.log(reviewers);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "An unknown error occurred";
    setFailed(errMsg);
  }
}

async function selectRandomReviewer() {
  const prCreator = context.payload.pull_request?.user.login;
  const candidates = await getCandidates();

  const reviewers = new Map<string, string>();

  for (const [team, members] of Object.entries(candidates)) {
    const eligibleMembers = members.filter(member => member !== prCreator && !reviewers.has(member));

    if (eligibleMembers.length > 0) {
      const randomReviewer = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
      reviewers.set(team, randomReviewer);
    }
  }

  return Object.fromEntries(reviewers);
}

async function getCandidates() {
  const reviewTeams = getReviewTeams();
  return await getTeamMembers(reviewTeams);
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

async function getTeamMembers(teams: string[]) {
  const githubToken = getInput("github_token");
  const octokit = getOctokit(githubToken);
  const teamMembersMap = new Map<string, string[]>();

  for (const team of teams) {
    const [org, teamSlug] = team.split('/').map(part => part.replace('@', ''));

    const { data: teamMembers } = await octokit.rest.teams.listMembersInOrg({
      org,
      team_slug: teamSlug,
    });

    const members = teamMembers.map(member => member.login);
    teamMembersMap.set(team, members);
  }

  return Object.fromEntries(teamMembersMap);
}

main()
