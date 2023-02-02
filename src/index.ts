import { getInput, setOutput } from '@actions/core';
import { context } from '@actions/github';

import axios from 'axios';
import { z } from 'zod';

const planetscaleInputSchema = z.object({
	orgName: z.string(),
	dbName: z.string(),
	serviceTokenId: z.string(),
	serviceToken: z.string(),

	action: z.enum(['create', 'deploy', 'delete']),

	parentBranchName: z.string(),
	branchName: z.string(),
});

const { orgName, dbName, serviceTokenId, serviceToken, branchName, parentBranchName, action } =
	planetscaleInputSchema.parse({
		orgName: process.env.PLANETSCALE_ORG_NAME,
		dbName: getInput('dbName') || process.env.PLANETSCALE_DB_NAME,
		serviceTokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID,
		serviceToken: process.env.PLANETSCALE_SERVICE_TOKEN,

		action: getInput('action'),
		parentBranchName: getInput('parentBranchName') || 'main',
		branchName: getInput('branchName') || context.ref.replace('refs/heads/', ''),
	});

const planetscaleBranchSchema = z.object({
	id: z.string(),
	name: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	restore_checklist_completed_at: z.string(),
	access_host_url: z.string(),
	schema_last_updated_at: z.string(),
	mysql_address: z.string(),
	mysql_edge_address: z.string(),
	initial_restore_id: z.string(),
	ready: z.boolean(),
	production: z.boolean(),
	sharded: z.boolean(),
	shard_count: z.number(),
	api_actor: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	restored_from_branch: z.object({
		id: z.string(),
		name: z.string(),
		created_at: z.string(),
		updated_at: z.string(),
		deleted_at: z.string(),
	}),
	html_url: z.string(),
	planetscale_region: z.object({
		id: z.string(),
		provider: z.string(),
		enabled: z.string(),
		public_ip_addresses: z.array(z.string()),
		display_name: z.string(),
		location: z.string(),
		slug: z.string(),
	}),
	parent_branch: z.string(),
	multiple_admins_required_for_demotion: z.boolean(),
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
	display_name: z.string(),
	role: z.string(),
	created_at: z.string(),
	deleted_at: z.string(),
	expires_at: z.string(),
	ttl_seconds: z.number(),
	actor: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	region: z.object({
		id: z.string(),
		provider: z.string(),
		enabled: z.string(),
		public_ip_addresses: z.array(z.string()),
		display_name: z.string(),
		location: z.string(),
		slug: z.string(),
	}),
	username: z.string(),
	renewable: z.boolean(),
	database_branch: z.object({
		name: z.string(),
		id: z.string(),
		production: z.boolean(),
		access_host_url: z.string(),
	}),
	integrations: z.array(
		z.object({
			name: z.string(),
			type: z.string(),
			content: z.object({
				plain: z.string(),
				highlighted: z.string(),
			}),
		})
	),
	plain_text: z.string(),
});

const planetscaleCreateDeployRequestResponseSchema = z.object({
	number: z.number(),
	id: z.string(),
	actor: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	closed_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch: z.string(),
	branch_deleted: z.boolean(),
	branch_deleted_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch_deleted_at: z.string(),
	into_branch: z.string(),
	into_branch_sharded: z.boolean(),
	into_branch_shard_count: z.number(),
	approved: z.boolean(),
	state: z.string(),
	deployment_state: z.string(),
	html_url: z.string(),
	notes: z.string(),
	html_body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	closed_at: z.string(),
	deployed_at: z.string(),
	deployment: z.object({
		id: z.string(),
		auto_cutover: z.boolean(),
		created_at: z.string(),
		cutover_at: z.string(),
		cutover_expiring: z.boolean(),
		deploy_check_errors: z.string(),
		finished_at: z.string(),
		queued_at: z.string(),
		ready_to_cutover_at: z.string(),
		started_at: z.string(),
		state: z.string(),
		submitted_at: z.string(),
		updated_at: z.string(),
	}),
});

const planetscaleQueueDeployRequestResponseSchema = z.object({
	number: z.number(),
	id: z.string(),
	actor: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	closed_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch: z.string(),
	branch_deleted: z.boolean(),
	branch_deleted_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch_deleted_at: z.string(),
	into_branch: z.string(),
	into_branch_sharded: z.boolean(),
	into_branch_shard_count: z.number(),
	approved: z.boolean(),
	state: z.string(),
	deployment_state: z.string(),
	html_url: z.string(),
	notes: z.string(),
	html_body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	closed_at: z.string(),
	deployed_at: z.string(),
});

const planetscaleGetDeployRequestResponseSchema = z.object({
	number: z.number(),
	id: z.string(),
	actor: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	closed_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch: z.string(),
	branch_deleted: z.boolean(),
	branch_deleted_by: z.object({
		id: z.string(),
		display_name: z.string(),
		avatar_url: z.string(),
	}),
	branch_deleted_at: z.string(),
	into_branch: z.string(),
	into_branch_sharded: z.boolean(),
	into_branch_shard_count: z.number(),
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

	html_url: z.string(),
	notes: z.string(),
	html_body: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	closed_at: z.string(),
	deployed_at: z.string(),
	deployment: z.object({
		id: z.string(),
		auto_cutover: z.boolean(),
		created_at: z.string(),
		cutover_at: z.string(),
		cutover_expiring: z.boolean(),
		deploy_check_errors: z.string(),
		finished_at: z.string(),
		queued_at: z.string(),
		ready_to_cutover_at: z.string(),
		started_at: z.string(),
		state: z.string(),
		submitted_at: z.string(),
		updated_at: z.string(),
	}),
});

const headers = {
	accept: 'application/json',
	'content-type': 'application/json',
	Authorization: `${serviceTokenId}:${serviceToken}`,
};

async function createBranch() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches`;
	const data = { name: branchName, parent_branch: parentBranchName };
	const options = { method: 'POST', url, headers, data };

	const newBranchRes = await axios.request(options);
	return planetscaleBranchSchema.parse(newBranchRes.data);
}

async function getBranchStatus() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'GET', url, headers };

	const branchStatusRes = await axios.request(options);
	return planetscaleBranchStatusResponseSchema.parse(branchStatusRes.data);
}

async function waitForBranchToBeReady() {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const branchStatus = await getBranchStatus();
		if (branchStatus.ready) {
			return branchStatus;
		}
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Branch failed to be ready');
}

async function createConnectionString() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}/passwords`;
	const data = { role: 'readwriter' };
	const options = { method: 'POST', url, headers, data };

	const planetscalePasswordResponse = await axios.request(options);
	const passwordData = planetscaleBranchPasswordResponseSchema.parse(
		planetscalePasswordResponse.data
	);

	return `mysql://${passwordData.username}:${passwordData.plain_text}@${passwordData.access_host_url}/${dbName}?sslaccept=strict`;
}

async function createDeployRequest() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
	const data = { branch: branchName, into_branch: parentBranchName };
	const options = { method: 'POST', url, headers, data };

	const deployRequestRes = await axios.request(options);
	const deployRequestData = planetscaleCreateDeployRequestResponseSchema.parse(
		deployRequestRes.data
	);

	return deployRequestData.number;
}

async function queueDeployRequest(deployRequestNumber: number) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}/deploy`;
	const options = { method: 'POST', url, headers };

	const deployRequestRes = await axios.request(options);
	const deployRequestData = planetscaleQueueDeployRequestResponseSchema.parse(
		deployRequestRes.data
	);

	return deployRequestData.number;
}

async function getDeployRequestStatus(deployRequestNumber: number) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}`;
	const options = { method: 'GET', url, headers };

	const deployRequestRes = await axios.request(options);
	const deployRequestData = planetscaleQueueDeployRequestResponseSchema.parse(
		deployRequestRes.data
	);

	return deployRequestData.deployment_state;
}

async function waitForDeployRequestToComplete(deployRequestNumber: number) {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const deployRequestStatus = await getDeployRequestStatus(deployRequestNumber);
		console.log('deployRequestStatus => ', deployRequestStatus);
		if (
			deployRequestStatus === 'complete' ||
			deployRequestStatus === 'complete_pending_revert'
		) {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Deploy request failed to complete');
}

// THREE ACTIONS TO CHOOSE FROM

async function createBranchAndConnectionString() {
	const newBranch = await createBranch();
	console.log('new branch => ', newBranch);

	const branchStatus = await waitForBranchToBeReady();
	console.log('branchStatus => ', branchStatus);

	const connectionString = await createConnectionString();
	console.log('connectionString => ', connectionString);

	setOutput('branch-name', branchName);
	setOutput('connection-string', connectionString);

	return connectionString;
}

async function createDeployRequestAndQueue() {
	const deployRequestNumber = await createDeployRequest();
	console.log('deployRequestNumber => ', deployRequestNumber);

	const queuedDeployRequestNumber = await queueDeployRequest(deployRequestNumber);
	console.log('queuedDeployRequestNumber => ', queuedDeployRequestNumber);

	await waitForDeployRequestToComplete(queuedDeployRequestNumber);

	console.log('deploy request complete');

	return queuedDeployRequestNumber;
}

async function deleteBranch() {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'DELETE', url, headers };

	const deleteBranchRes = await axios.request(options);
	if (deleteBranchRes.status !== 204) {
		throw new Error('Branch delete failed');
	}
	return console.log('branch successfully deleted');
}

// RUN THE ACTION
if (action === 'create') createBranchAndConnectionString();
if (action === 'deploy') createDeployRequestAndQueue();
if (action === 'delete') deleteBranch();
