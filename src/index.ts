import { getInput, getBooleanInput, setOutput } from '@actions/core';
import { context } from '@actions/github';

import { z } from 'zod';

import { deleteBranch } from './endpoints/branch';

import { createBranchAndConnectionString } from './scripts/createBranchAndConnectionString';
import { openDeployRequest } from './scripts';
import { queueMostRecentDeployRequest } from './scripts/queueMostRecentDeployRequest';

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

	action: z.enum([
		'create-branch',
		'open-deploy-request',
		'queue-deploy-request',
		'delete-branch',
	]),
	parentBranchName: z.string(),
	branchName: z
		.string()
		.transform(str => str.replace(/[^a-zA-Z0-9-]/g, '-'))
		.refine(str => str.length > 1),
	overwriteExistingBranch: z.boolean(),
});

const actionInputs = actionInputsSchema.parse({
	orgName: process.env.PLANETSCALE_ORG_NAME,
	dbName: process.env.PLANETSCALE_DB_NAME,
	serviceTokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID,
	serviceToken: process.env.PLANETSCALE_SERVICE_TOKEN,

	action: getInput('action'),
	parentBranchName: getInput('parent-branch-name') || 'main',
	branchName: getInput('branch-name') || gitBranchName,
	overwriteExistingBranch: getBooleanInput('overwrite-existing-branch'),
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

setOutput('branch-name', actionProps.branchName);

// RUN THE ACTION

if (actionInputs.action === 'create-branch') createBranchAndConnectionString(actionProps);
if (actionInputs.action === 'open-deploy-request') openDeployRequest(actionProps);
if (actionInputs.action === 'queue-deploy-request') queueMostRecentDeployRequest(actionProps);
if (actionInputs.action === 'delete-branch') deleteBranch(actionProps);
