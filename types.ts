export interface ProjectConfig {
	name: string;
	body?: string;
}

export interface IssueConfig {
	title: string;
	body: string;
	labels?: string[];
	milestone?: number;
	assignees?: string[];
	project_id?: number;
}

export enum CommitType {
	FEAT = "feat",
	FIX = "fix",
	PERF = "perf",
	REFACTOR = "refactor",
	STYLE = "style",
	TEST = "test",
	BUILD = "build",
	OPS = "ops",
	DOCS = "docs",
	CHORE = "chore",
	MERGE = "merge",
	REVERT = "revert",
}

export interface TaskConfig {
	title: string;
	difficulty: string;
	assignee: string;
	commitType: CommitType;
}

export interface WeekPlan {
	week: string;
	goal: string;
	difficulty: string;
	assignee: string;
	tasks: TaskConfig[];
}
