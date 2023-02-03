import { getInput, getBooleanInput, setOutput } from '@actions/core';
import { context } from '@actions/github';

import axios from 'axios';
import { error } from 'console';
import { z } from 'zod';

import crypto from 'crypto';

// INPUTS

const planetscaleInputSchema = z.object({
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

console.log('context.eventName => ', context.eventName);

let branchNameInput: string | undefined;

if (context.eventName === 'pull_request') {
	branchNameInput = context.payload.pull_request?.head.ref;
	console.log('branchNameInput for pull request => ', branchNameInput);
}

if (context.eventName === 'push') {
	branchNameInput = context.payload.ref;
	console.log('branchNameInput for push => ', branchNameInput);
}

console.log('getInput(overwriteBranch) => ', getBooleanInput('overwrite-branch'));

const planetscaleInputs = planetscaleInputSchema.parse({
	orgName: process.env.PLANETSCALE_ORG_NAME,
	dbName: process.env.PLANETSCALE_DB_NAME,
	serviceTokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID,
	serviceToken: process.env.PLANETSCALE_SERVICE_TOKEN,

	action: getInput('action'),
	parentBranchName: getInput('parent-branch-name') || 'main',
	branchName: getInput('branch-name') || branchNameInput,
	overwriteBranch: getBooleanInput('overwrite-branch'),
});

const {
	orgName,
	dbName,
	serviceTokenId,
	serviceToken,
	branchName,
	parentBranchName,
	action,
	overwriteBranch,
} = planetscaleInputs;

console.log('planetscaleInputs => ', planetscaleInputs);

// API SCHEMA

const planetscaleBranchSchema = z.object({
	id: z.string(),
	name: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	// restore_checklist_completed_at: z.string().nullish(),
	// access_host_url: z.string(),
	// schema_last_updated_at: z.string(),
	// mysql_address: z.string(),
	// mysql_edge_address: z.string(),
	// initial_restore_id: z.string().nullish(),
	ready: z.boolean(),
	// production: z.boolean(),
	// sharded: z.boolean(),
	// shard_count: z.number(),
	// api_actor: z
	// 	.object({
	// 		id: z.string(),
	// 		display_name: z.string(),
	// 		avatar_url: z.string(),
	// 	})
	// 	.nullish(),
	// restored_from_branch: z
	// 	.object({
	// 		id: z.string(),
	// 		name: z.string(),
	// 		created_at: z.string(),
	// 		updated_at: z.string(),
	// 		deleted_at: z.string(),
	// 	})
	// 	.nullish(),
	// html_url: z.string(),
	// planetscale_region: z
	// 	.object({
	// 		id: z.string(),
	// 		provider: z.string(),
	// 		enabled: z.string(),
	// 		public_ip_addresses: z.array(z.string()),
	// 		display_name: z.string(),
	// 		location: z.string(),
	// 		slug: z.string(),
	// 	})
	// 	.nullish(),
	// parent_branch: z.string(),
	// multiple_admins_required_for_demotion: z.boolean(),
});

const planetscaleBranchStatusResponseSchema = z.object({
	id: z.string(),
	ready: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});

const planetscaleBranchPasswordResponseSchema = z.object({
	id: z.string(),
	access_host_url: z.string(),
	// display_name: z.string(),
	// role: z.string(),
	// created_at: z.string(),
	// deleted_at: z.string().nullish(),
	// expires_at: z.string().nullish(),
	// ttl_seconds: z.number().nullish(),
	// actor: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	// region: z
	// 	.object({
	// 		id: z.string(),
	// 		provider: z.string(),
	// 		enabled: z.string().nullish(),
	// 		public_ip_addresses: z.array(z.string()),
	// 		display_name: z.string(),
	// 		location: z.string(),
	// 		slug: z.string(),
	// 	})
	// 	.nullish(),
	username: z.string(),
	// renewable: z.boolean(),
	// database_branch: z.object({
	// 	name: z.string(),
	// 	id: z.string(),
	// 	production: z.boolean(),
	// 	access_host_url: z.string(),
	// }),
	// integrations: z.array(
	// 	z.object({
	// 		name: z.string(),
	// 		type: z.string().nullish(),
	// 		content: z
	// 			.object({
	// 				plain: z.string(),
	// 				highlighted: z.string(),
	// 			})
	// 			.nullish(),
	// 	})
	// ),
	plain_text: z.string(),
});

const planetscaleDeployRequestResponseSchema = z.object({
	number: z.number(),
	id: z.string(),
	// actor: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	// closed_by: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	branch: z.string(),
	// branch_deleted: z.boolean(),
	// branch_deleted_by: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	// branch_deleted_at: z.string(),
	// into_branch: z.string(),
	// into_branch_sharded: z.boolean(),
	// into_branch_shard_count: z.number(),
	// approved: z.boolean(),
	state: z.string(),
	deployment_state: z.string(),
	// html_url: z.string(),
	// notes: z.string(),
	// html_body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	// closed_at: z.string(),
	deployed_at: z.string(),
	// deployment: z.object({
	// 	id: z.string(),
	// 	auto_cutover: z.boolean(),
	// 	created_at: z.string(),
	// 	cutover_at: z.string(),
	// 	cutover_expiring: z.boolean(),
	// 	deploy_check_errors: z.string(),
	// 	finished_at: z.string(),
	// 	queued_at: z.string(),
	// 	ready_to_cutover_at: z.string(),
	// 	started_at: z.string(),
	// 	state: z.string(),
	// 	submitted_at: z.string(),
	// 	updated_at: z.string(),
	// }),
});

// const planetscaleQueueDeployRequestResponseSchema = z.object({
// 	number: z.number(),
// 	id: z.string(),
// 	// actor: z.object({
// 	// 	id: z.string(),
// 	// 	display_name: z.string(),
// 	// 	avatar_url: z.string(),
// 	// }),
// 	// closed_by: z.object({
// 	// 	id: z.string(),
// 	// 	display_name: z.string(),
// 	// 	avatar_url: z.string(),
// 	// }),
// 	// branch: z.string(),
// 	// branch_deleted: z.boolean(),
// 	// branch_deleted_by: z.object({
// 	// 	id: z.string(),
// 	// 	display_name: z.string(),
// 	// 	avatar_url: z.string(),
// 	// }),
// 	// branch_deleted_at: z.string(),
// 	into_branch: z.string(),
// 	// into_branch_sharded: z.boolean(),
// 	// into_branch_shard_count: z.number(),
// 	approved: z.boolean(),
// 	state: z.string(),
// 	deployment_state: z.string(),
// 	// html_url: z.string(),
// 	// notes: z.string(),
// 	// html_body: z.string(),
// 	created_at: z.string(),
// 	updated_at: z.string(),
// 	// closed_at: z.string(),
// 	deployed_at: z.string(),
// });

const planetscaleGetDeployRequestResponseSchema = z.object({
	number: z.number(),
	id: z.string(),
	// actor: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	// closed_by: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	branch: z.string(),
	// branch_deleted: z.boolean(),
	// branch_deleted_by: z.object({
	// 	id: z.string(),
	// 	display_name: z.string(),
	// 	avatar_url: z.string(),
	// }),
	// branch_deleted_at: z.string(),
	into_branch: z.string(),
	// into_branch_sharded: z.boolean(),
	// into_branch_shard_count: z.number(),
	approved: z.boolean(),
	state: z.string(),
	/* deployment_state is an enum of the following: pending ready no_changes queued submitting in_progress pending_cutover in_progress_vschema in_progress_cancel in_progress_cutover complete complete_cancel complete_error complete_pending_revert in_progress_revert complete_revert complete_revert_error cancelled error */
	deployment_state: z.enum([
		'pending',
		'ready',
		'no_changes',
		'queued',
		'submitting',
		'in_progress',
		'pending_cutover',
		'in_progress_vschema',
		'in_progress_cancel',
		'in_progress_cutover',
		'complete',
		'complete_cancel',
		'complete_error',
		'complete_pending_revert',
		'in_progress_revert',
		'complete_revert',
		'complete_revert_error',
		'cancelled',
		'error',
	]),
	// html_url: z.string(),
	notes: z.string().nullish(),
	// html_body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	closed_at: z.string(),
	deployed_at: z.string(),
	// deployment: z.object({
	// 	id: z.string(),
	// 	auto_cutover: z.boolean(),
	// 	created_at: z.string(),
	// 	cutover_at: z.string(),
	// 	cutover_expiring: z.boolean(),
	// 	deploy_check_errors: z.string(),
	// 	finished_at: z.string(),
	// 	queued_at: z.string(),
	// 	ready_to_cutover_at: z.string(),
	// 	started_at: z.string(),
	// 	state: z.string(),
	// 	submitted_at: z.string(),
	// 	updated_at: z.string(),
	// }),
});

const headers = {
	accept: 'application/json',
	'content-type': 'application/json',
	Authorization: `${serviceTokenId}:${serviceToken}`,
};

// API ENDPOINTS

async function getBranch() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { url, headers };

	const existingBranchData = await axios
		.request(options)
		.then(res => {
			console.log('getBranchData => ', res.data);
			return res.data;
		})
		.catch(err => {
			if (err.response.status === 404) {
				console.log('that branch does not exist.');
				return null;
			}
			throw new Error(err.response.data.message);
		});
	const parsedBranchData = planetscaleBranchSchema.nullable().parse(existingBranchData);
	console.log('parsedBranchData => ', parsedBranchData);
	return parsedBranchData;
}

async function createBranch() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches`;
	const data = { name: branchName, parent_branch: parentBranchName };
	const options = { method: 'POST', url, headers, data };

	const newBranchData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});
	return planetscaleBranchSchema.parse(newBranchData);
}

async function getBranchStatus() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'GET', url, headers };

	const branchStatus = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			if (err.response.status === 404) {
				throw error('that branch does not exist.');
			}
			throw new Error(err.response.data.message);
		});
	return planetscaleBranchStatusResponseSchema.parse(branchStatus);
}

async function createConnectionString() {
	const pwId = crypto
		.randomUUID()
		.replace(/[^a-zA-Z0-9]/g, '')
		.slice(0, 10);
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}/passwords`;
	const data = { role: 'readwriter', name: `${branchName}-${pwId}` };
	const options = { method: 'POST', url, headers, data };

	const planetscalePasswordData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});
	const passwordData = planetscaleBranchPasswordResponseSchema.parse(planetscalePasswordData);

	return `mysql://${passwordData.username}:${passwordData.plain_text}@${passwordData.access_host_url}/${dbName}?sslaccept=strict`;
}

// deploy requests

async function getDeployRequest(deployRequestNumber: number) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}`;
	const options = { method: 'GET', url, headers };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	return planetscaleDeployRequestResponseSchema.parse(deployRequestData);
}

async function getAllDeployRequests() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
	const options = { method: 'GET', url, headers };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	return z.array(planetscaleDeployRequestResponseSchema).parse(deployRequestData);

	// return planetscaleQueueDeployRequestResponseSchema.parse(deployRequestData);
}

async function createDeployRequest() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
	const data = { branch: branchName, into_branch: parentBranchName };
	const options = { method: 'POST', url, headers, data };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	return planetscaleDeployRequestResponseSchema.parse(deployRequestData).number;
}

async function queueDeployRequest(deployRequestNumber: number) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}/deploy`;
	const options = { method: 'POST', url, headers };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	return planetscaleDeployRequestResponseSchema.parse(deployRequestData).number;
}

async function deleteBranch() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'DELETE', url, headers };

	return axios
		.request(options)
		.then(res => console.log('branch successfully deleted'))
		.catch(err => {
			throw new Error(err.response.data.message);
		});
}

// WAITS

async function waitForBranchToBeReady() {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const branchStatus = await getBranchStatus();

		if (branchStatus.ready) {
			console.log('branch is ready!');
			return branchStatus;
		}
		console.log('branch is not ready yet, waiting...');
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Branch failed to be ready');
}

async function waitForDeployRequestToBeSafe(deployRequestNumber: number) {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const deployRequestStatus = (await getDeployRequest(deployRequestNumber)).deployment_state;
		console.log('deployRequestStatus => ', deployRequestStatus);
		if (deployRequestStatus === 'ready') {
			console.log('deploy request is ready!');
			return 'ready';
		}

		if (deployRequestStatus === 'cancelled' || deployRequestStatus === 'error') {
			throw new Error('Deploy request failed');
		}

		console.log('currently validating that these changes are safe to deploy.');
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Deploy request failed');
}

async function waitForDeployRequestToComplete(deployRequestNumber: number) {
	const start = Date.now();
	const timeout = 300000;
	let backoff = 1000;

	while (Date.now() - start < timeout) {
		const deployRequestStatus = (await getDeployRequest(deployRequestNumber)).deployment_state;
		console.log('deployRequestStatus => ', deployRequestStatus);
		if (
			deployRequestStatus === 'complete' ||
			deployRequestStatus === 'complete_pending_revert'
		) {
			return 'complete';
		}
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error(`Deploy request failed to complete within ${timeout / 1000} seconds.`);
}

// GITHUB ACTIONS (COMBINED ENDPOINTS)

async function createBranchAndConnectionString() {
	const branch = await getBranch();

	console.log('overwriteBranch => ', overwriteBranch);

	if (branch && overwriteBranch) {
		console.log('deleting branch...');
		await deleteBranch();
	}

	if (!branch || overwriteBranch) {
		const newBranch = await createBranch();
		console.log('new branch => ', newBranch);
	}

	const branchStatus = await waitForBranchToBeReady();
	console.log('branchStatus => ', branchStatus);

	const connectionString = await createConnectionString();
	console.log('connectionString => ', connectionString);

	setOutput('branch-name', branchName);
	setOutput('connection-string', connectionString);

	return connectionString;
}

async function createDeployRequestAndQueue() {
	// check if deploy request already exists for this branch
	const deployRequests = await getAllDeployRequests();
	let deployRequestNumber = deployRequests.find(req => req.branch === branchName)?.number;

	if (!deployRequestNumber) {
		deployRequestNumber = await createDeployRequest();
		console.log('deployRequestCreated reqNumber => ', deployRequestNumber);
	}

	// const deployRequestNumber = await createDeployRequest();
	// console.log('deployRequestCreated reqNumber => ', deployRequestNumber);

	await waitForDeployRequestToBeSafe(deployRequestNumber);

	const queuedDeployRequestNumber = await queueDeployRequest(deployRequestNumber);
	console.log('deployRequest queued to merge with main => ', queuedDeployRequestNumber);

	await waitForDeployRequestToComplete(queuedDeployRequestNumber);

	console.log('deploy request complete');

	setOutput('branch-name', branchName);
	setOutput('deploy-request-number', queuedDeployRequestNumber);
	setOutput('deploy-request-status', 'complete');

	return queuedDeployRequestNumber;
}

// RUN THE ACTION
if (action === 'create') createBranchAndConnectionString();
if (action === 'deploy') createDeployRequestAndQueue();
if (action === 'delete') deleteBranch();
