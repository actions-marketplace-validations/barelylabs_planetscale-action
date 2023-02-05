import axios from 'axios';
import { z } from 'zod';
import { BranchActionProps } from '../';

const planetscaleBranchSchema = z.object({
	id: z.string(),
	name: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	ready: z.boolean(),
	// restore_checklist_completed_at: z.string().nullish(),
	// access_host_url: z.string(),
	// schema_last_updated_at: z.string(),
	// mysql_address: z.string(),
	// mysql_edge_address: z.string(),
	// initial_restore_id: z.string().nullish(),
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

export async function getBranch({ orgName, dbName, branchName, headers }: BranchActionProps) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'GET', url, headers };
	const existingBranchData = await axios
		.request(options)
		.then(res => {
			// console.log('getBranchData => ', res.data);
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
	// console.log('parsedBranchData => ', parsedBranchData);
	return parsedBranchData;
}

export async function createBranch(props: BranchActionProps & { parentBranchName: string }) {
	const { orgName, dbName, parentBranchName, branchName, headers } = props;
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

export async function deleteBranch({
	orgName,
	dbName,
	branchName,
	headers,
}: BranchActionProps) {
	const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
	const options = { method: 'DELETE', url, headers };

	return axios
		.request(options)
		.then(res => console.log('branch successfully deleted'))
		.catch(err => {
			throw new Error(err.response.data.message);
		});
}
