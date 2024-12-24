import axios from "axios";
import { projectPlan } from "@/constants";
import type { ProjectConfig, IssueConfig } from "@/types";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN_D,
	REPO_OWNER = process.env.REPO_OWNER || "<REPO_OWNER>",
	REPO_NAME = process.env.REPO_NAME || "<REPO_NAME>";

const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const githubAPI = {
	headers: {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		Accept: "application/vnd.github.v3+json",
	},

	async getOwnerId() {
		const response = await fetch(`https://api.github.com/users/${REPO_OWNER}`, {
			headers: this.headers
		});
		const data = await response.json();
		return data.node_id;
	},

	async getRepoId() {
		const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
			headers: {
				'Authorization': `Bearer ${GITHUB_TOKEN}`,
				'Accept': 'application/vnd.github.v3+json',
			},
		});
		const data = await response.json();
		return data.node_id;
	},

	async checkExistingProject(name: string) {
		const query = `
			query($owner: String!, $name: String!) {
				user(login: $owner) {
					projectV2(number: 1) {
						id
						title
						url
					}
				}
			}
		`;

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query,
				variables: {
					owner: REPO_OWNER,
					name
				}
			}),
		});

		const data = await response.json();
		if (data.errors) {
			return null;
		}
		
		const project = data.data?.user?.projectV2;
		return project?.title === name ? project : null;
	},

	async checkExistingMilestone(title: string) {
		try {
			const response = await axios.get(`${BASE_URL}/milestones`, { headers: this.headers });
			return response.data.find((m: any) => m.title === title);
		} catch (error) {
			console.error('Error checking existing milestone:', error);
			return null;
		}
	},

	async checkExistingBranch(branchName: string) {
		try {
			const response = await axios.get(`${BASE_URL}/git/refs/heads/${branchName}`, { headers: this.headers });
			return response.data;
		} catch (error) {
			return null;
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
				{ headers: this.headers },
			);
			console.log(`Created branch: ${branchName}`);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 422) {
					console.log(`Branch ${branchName} already exists`);
					return await this.checkExistingBranch(branchName);
				}
				console.error('Error creating branch:', {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data
				});
			}
			throw error;
		}
	},

	async getDefaultBranch() {
		try {
			const response = await axios.get(
				`${BASE_URL}`,
				{ headers: this.headers }
			);
			return response.data.default_branch;
		} catch (error) {
			console.error("Error getting default branch:", error);
			throw error;
		}
	},

	async getMainBranchSHA() {
		try {
			const defaultBranch = await this.getDefaultBranch();
			const response = await axios.get(
				`${BASE_URL}/git/refs/heads/${defaultBranch}`,
				{ headers: this.headers }
			);
			return response.data.object.sha;
		} catch (error) {
			console.error("Error getting main branch SHA:", error);
			throw error;
		}
	},

	async createProjectV2(config: ProjectConfig) {
		const ownerId = await this.getOwnerId();
		const query = `
			mutation CreateProjectV2($input: CreateProjectV2Input!) {
				createProjectV2(input: $input) {
					projectV2 {
						id
						url
					}
				}
			}
		`;

		const variables = {
			input: {
				ownerId: ownerId,
				title: config.name,
				repositoryId: await this.getRepoId(),
			}
		};

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ query, variables }),
		});

		const data = await response.json();
		
		if (data.errors) {
			console.error('GraphQL Errors:', data.errors);
			throw new Error(data.errors[0].message);
		}

		if (!data.data?.createProjectV2?.projectV2) {
			console.error('Unexpected response:', data);
			throw new Error('Failed to create project');
		}

		return data.data.createProjectV2.projectV2;
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
				{ headers: this.headers },
			);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 422) {
					const existingMilestone = await axios.get(
						`${BASE_URL}/milestones`,
						{ headers: this.headers }
					);
					const milestone = existingMilestone.data.find((m: any) => m.title === title);
					if (milestone) {
						console.log(`Using existing milestone: ${title}`);
						return milestone;
					}
				}
				console.error('Error creating milestone:', {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
					url: error.config?.url,
					method: error.config?.method,
					headers: error.config?.headers
				});
			}
			throw error;
		}
	},

	async createIssue(config: IssueConfig): Promise<any> {
		try {
			const response = await axios.post(`${BASE_URL}/issues`, config, {
				headers: this.headers,
			});
			console.log(`Issue created: ${response.data.html_url}`);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error creating issue:', {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
					url: error.config?.url,
					method: error.config?.method
				});
			}
			throw error;
		}
	},

	async addIssueToProject(issueId: string, projectId: string) {
		const query = `
			mutation AddIssueToProject($projectId: ID!, $issueId: ID!) {
				addProjectV2ItemById(input: {
					projectId: $projectId
					contentId: $issueId
				}) {
					item {
						id
					}
				}
			}
		`;

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${GITHUB_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query,
				variables: {
					projectId,
					issueId
				}
			}),
		});

		const data = await response.json();
		if (data.errors) {
			throw new Error(`Failed to add issue to project: ${data.errors[0].message}`);
		}
		return data;
	},
};

async function setupProjectStructure(): Promise<void> {
	try {
		const existingProject = await githubAPI.checkExistingProject("<project name>");
		const project = existingProject || await githubAPI.createProjectV2({
			name: "<project name>",
			body: "<project description>"
		});

		if (!project || !project.id) {
			throw new Error('Failed to create or find project');
		}

		const milestones = await Promise.all(
			projectPlan.map(async week => {
				const existingMilestone = await githubAPI.checkExistingMilestone(week.week);
				if (existingMilestone) {
					console.log(`Using existing milestone: ${week.week}`);
					return existingMilestone;
				}
				return githubAPI.createMilestone(
					week.week,
					week.goal,
					new Date(Date.now() + parseInt(week.week.split(' ')[1]) * 7 * 24 * 60 * 60 * 1000).toISOString()
				);
			})
		);

		const mainSHA = await githubAPI.getMainBranchSHA();

		for (let i = 0; i < projectPlan.length; i++) {
			const week = projectPlan[i];
			const milestone = milestones[i];

			for (const task of week.tasks) {
				const branchName = `${task.commitType}/${task.title.toLowerCase().replace(/\s+/g, "-")}`;
				
				try {
					await githubAPI.createBranch(branchName, mainSHA);
					const issueConfig: IssueConfig = {
						title: `[${task.commitType}] ${week.week}: ${task.title}`,
						body: `Task for ${week.week}: ${task.title}\n\nBranch: \`${branchName}\``,
						labels: [`difficulty:${task.difficulty}`],
						milestone: milestone.number,
						assignees: [task.assignee],
						project_id: project.id,
					};

					const issue = await githubAPI.createIssue(issueConfig);
					await githubAPI.addIssueToProject(issue.node_id, project.id);
					console.log(`Created issue #${issue.number} with branch ${branchName} and added to project`);
				} catch (error) {
					console.error(`Failed to create issue/branch or add to project for ${task.title}:`, error);
				}
			}
		}
	} catch (error) {
		console.error('Error in project setup:', error);
		throw error;
	}
}

if (require.main === module) {
	setupProjectStructure().catch(console.error);
}