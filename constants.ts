import type { WeekPlan } from "@/types";
import { CommitType } from "@/types";

export const projectPlan: WeekPlan[] = [
	{
		week: "Week 1 (<month (3 letters)> <day>-<day>)",
		goal: "<goal>",
		difficulty: "hard",
		assignee: "<username>",
		tasks: [
			{
				title: "<title>",
				difficulty: "medium",
				assignee: "<username>",
				commitType: CommitType.CHORE,
			},
			{
				title: "<title>",
				difficulty: "hard",
				assignee: "<username>",
				commitType: CommitType.FEAT,
			},
			{
				title: "<title>",
				difficulty: "medium",
				assignee: "<username>",
				commitType: CommitType.FEAT,
			},
		],
	},
  // Rest...
];