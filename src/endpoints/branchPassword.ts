import { z } from 'zod';
import crypto from 'crypto';
import axios from 'axios';
import { BranchActionProps } from '..';

const planetscaleBranchPasswordResponseSchema = z.object({
	id: z.string(),
	access_host_url: z.string(),
	username: z.string(),
	plain_text: z.string(),
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
});

export async function createConnectionString(props: BranchActionProps) {
	const { orgName, dbName, branchName, headers } = props;

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
