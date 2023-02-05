import axios from 'axios';
import { z } from 'zod';
import { BranchActionProps } from '..';

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
	state: z.enum(['open', 'closed']),
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
	// notes: z.string(),
	// html_body: z.string(),
	created_at: z.string().nullish(),
	updated_at: z.string().nullish(),
	// closed_at: z.string(),
	deployed_at: z.string().nullish(),
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

export async function getDeployRequest(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	const { orgName, dbName, headers, deployRequestNumber } = props;
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

export async function getAllDeployRequests(props: BranchActionProps) {
	const { orgName, dbName, headers } = props;
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
	const options = { method: 'GET', url, headers };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	const deployRequests = z
		.object({ data: z.array(planetscaleDeployRequestResponseSchema) })
		.parse(deployRequestData);

	console.log('allDeployRequests => ', deployRequests);
	return deployRequests.data;
}

export async function createDeployRequest(
	props: BranchActionProps & { branchName: string; parentBranchName: string }
) {
	const { orgName, dbName, headers, branchName, parentBranchName } = props;
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
	const data = { branch: branchName, into_branch: parentBranchName };
	const options = { method: 'POST', url, headers, data };

	const deployRequestData = await axios
		.request(options)
		.then(res => res.data)
		.catch(err => {
			throw new Error(err.response.data.message);
		});

	return planetscaleDeployRequestResponseSchema.parse(deployRequestData);
}

export async function queueDeployRequest(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	const { orgName, dbName, headers, deployRequestNumber } = props;
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
