import axios from 'axios'

const 
  GITHUB_TOKEN = process.env.GITHUB_TOKEN_M,
  REPO_OWNER = process.env.REPO_OWNER || '<REPO_OWNER>',
  REPO_NAME = process.env.REPO_NAME || '<REPO_NAME>';

const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

interface ProjectConfig {
  name: string;
  body?: string;
}

interface IssueConfig {
  title: string;
  body: string;
  labels?: string[];
  milestone?: number;
  assignees?: string[];
  project_id?: number;
}

enum CommitType {
  FEAT = 'feat',
  FIX = 'fix',
  PERF = 'perf',
  REFACTOR = 'refactor',
  STYLE = 'style',
  TEST = 'test',
  BUILD = 'build',
  OPS = 'ops',
  DOCS = 'docs',
  CHORE = 'chore',
  MERGE = 'merge',
  REVERT = 'revert'
}

interface TaskConfig {
  title: string;
  difficulty: string;
  assignee: string;
  commitType: CommitType;
}

interface WeekPlan {
  week: string;
  goal: string;
  difficulty: string;
  assignee: string;
  tasks: TaskConfig[];
}

const githubAPI = {
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  },

  async createProject(config: ProjectConfig) {
    try {
      const response = await axios.post(
        `${BASE_URL}/projects`,
        config,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async createMilestone(title: string, description: string, dueDate?: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/milestones`,
        {
          title,
          description,
          due_on: dueDate,
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  },

  async createIssue(config: IssueConfig) {
    try {
      const response = await axios.post(
        `${BASE_URL}/issues`,
        config,
        { headers: this.headers }
      );
      console.log(`Issue created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  },

  async createBranch(branchName: string, sha: string) {
    try {
      const response = await axios.post(
        `${BASE_URL}/git/refs`,
        {
          ref: `refs/heads/${branchName}`,
          sha,
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }
};

const projectPlan: WeekPlan[] = [
  {
    week: 'Week 1',
    goal: 'Finalize project scope and requirements...',
    difficulty: 'medium',
    assignee: 'lead-dev',
    tasks: [
      {
        title: 'Finalize project scope and requirements',
        difficulty: 'easy',
        assignee: 'project-manager',
        commitType: CommitType.DOCS
      },
      // ... other tasks
    ],
  },
  // ... other weeks
];


async function setupProjectStructure() {
  try {
    const project = await githubAPI.createProject({
      name: '<PROJECT_NAME>',
      body: '<PROJECT_DESCRIPTION>'
    });

    const milestones = await Promise.all(
      projectPlan.map(week => 
        githubAPI.createMilestone(
          week.week,
          week.goal,
          new Date(Date.now() + parseInt(week.week.split(' ')[1]) * 7 * 24 * 60 * 60 * 1000).toISOString()
        )
      )
    );

    for (let i = 0; i < projectPlan.length; i++) {
      const week = projectPlan[i];
      const milestone = milestones[i];

      for (const task of week.tasks) {
        const issueConfig: IssueConfig = {
          title: `[${task.commitType}] ${week.week}: ${task.title}`,
          body: `Task for ${week.week}: ${task.title}`,
          labels: [`difficulty:${task.difficulty}`],
          milestone: milestone.number,
          assignees: [task.assignee],
          project_id: project.id
        };

        const issue = await githubAPI.createIssue(issueConfig);

        const branchName = `${task.commitType}/${task.title.toLowerCase().replace(/\s+/g, '-')}`;
        await githubAPI.createBranch(branchName, 'main');
      }
    }

  } catch (error) {
    console.error('Error in project setup:', error);
    throw error;
  }
}

setupProjectStructure();