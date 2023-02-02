"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const orgName = 'barelylabs';
const dbName = 'barely';
const branchName = 'feat-setup-action';
const serviceTokenId = 'ld8lxh5cwy7b';
const serviceToken = 'pscale_tkn_rT42Ft0mpP_-4AB859d4gnrNRNe09rj6W7ufILBKpFI';
const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: `${serviceTokenId}:${serviceToken}`,
};
const planetscaleBranchPasswordResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    access_host_url: zod_1.z.string(),
    display_name: zod_1.z.string(),
    role: zod_1.z.string(),
    created_at: zod_1.z.string(),
    deleted_at: zod_1.z.string().nullish(),
    expires_at: zod_1.z.string().nullish(),
    ttl_seconds: zod_1.z.number().nullish(),
    // actor: z.object({
    // 	id: z.string(),
    // 	display_name: z.string(),
    // 	avatar_url: z.string(),
    // }),
    // region: z.object({
    // 	id: z.string(),
    // 	provider: z.string(),
    // 	enabled: z.string(),
    // 	public_ip_addresses: z.array(z.string()),
    // 	display_name: z.string(),
    // 	location: z.string(),
    // 	slug: z.string(),
    // }).nullish(),
    username: zod_1.z.string(),
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
    // 		type: z.string(),
    // 		content: z.object({
    // 			plain: z.string(),
    // 			highlighted: z.string(),
    // 		}),
    // 	})
    // ).nullish(),
    plain_text: zod_1.z.string(),
});
async function createConnectionString() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}/passwords`;
    console.log('url => ', url);
    // const data = {}; //{ role: 'readwriter' };
    const data = { role: 'readwriter' };
    const options = { method: 'POST', url, headers, data };
    const planetscalePasswordData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw new Error(err.response.data.message);
    });
    // console.log('planetscalePasswordData => ', planetscalePasswordData);
    const passwordData = planetscaleBranchPasswordResponseSchema.parse(planetscalePasswordData);
    console.log('passwordData => ', passwordData);
    return `mysql://${passwordData.username}:${passwordData.plain_text}@${passwordData.access_host_url}/${dbName}?sslaccept=strict`;
}
console.log('getting connection string');
createConnectionString();
async function getBranchPasswords() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}/passwords`;
    const options = { method: 'GET', url, headers };
    const planetscalePasswordData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw new Error(err.response.data.message);
    });
    console.log('passwordData => ', planetscalePasswordData);
}
// console.log('getting branch passwords');
// getBranchPasswords();
