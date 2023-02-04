import { getInput, getBooleanInput, setOutput } from '@actions/core';
import { context } from '@actions/github';

import { z } from 'zod';

import { createBranchAndConnectionString } from './scripts/createBranchAndConnectionString';
import { createDeployRequestAndQueue } from './scripts/createDeployRequestAndQueue';
import { deleteBranch } from './endpoints/branch';
import { getAllDeployRequests } from './endpoints/deployRequest';

// branch name

const gitBranchName =
	context.eventName === 'pull_request'
		? context.payload.pull_request?.head.ref
		: context.payload.ref;

const actionInputsSchema = z.object({
	orgName: z.string(),
	dbName: z.string(),
	serviceTokenId: z.string(),
	serviceToken: z.string(),
	action: z.enum(['create', 'deploy', 'delete']),
	parentBranchName: z.string(),
	branchName: z
		.string()
		.transform(str => str.replace(/[^a-zA-Z0-9-]/g, '-'))
		.refine(str => str.length > 1),
	overwriteBranch: z.boolean(),
});

const actionInputs = actionInputsSchema.parse({
	orgName: process.env.PLANETSCALE_ORG_NAME,
	dbName: process.env.PLANETSCALE_DB_NAME,
	serviceTokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID,
	serviceToken: process.env.PLANETSCALE_SERVICE_TOKEN,

	action: getInput('action'),
	parentBranchName: getInput('parent-branch-name') || 'main',
	branchName: getInput('branch-name') || gitBranchName,
	overwriteBranch: getBooleanInput('overwrite-branch'),
});

const actionProps = {
	...actionInputs,
	headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		Authorization: `${actionInputs.serviceTokenId}:${actionInputs.serviceToken}`,
	},
};

export type BranchActionProps = typeof actionProps;

// RUN THE ACTION
if (actionInputs.action === 'create') createBranchAndConnectionString(actionProps);
// if (actionInputs.action === 'deploy') createDeployRequestAndQueue(actionProps);
if (actionInputs.action === 'deploy') getAllDeployRequests(actionProps);
if (actionInputs.action === 'delete') deleteBranch(actionProps);
