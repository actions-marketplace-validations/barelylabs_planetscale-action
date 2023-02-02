"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const axios_1 = __importDefault(require("axios"));
const console_1 = require("console");
const zod_1 = require("zod");
const planetscaleInputSchema = zod_1.z.object({
    orgName: zod_1.z.string(),
    dbName: zod_1.z.string(),
    serviceTokenId: zod_1.z.string(),
    serviceToken: zod_1.z.string(),
    action: zod_1.z.enum(['create', 'deploy', 'delete']),
    parentBranchName: zod_1.z.string(),
    branchName: zod_1.z
        .string()
        .transform(str => str.replace(/[^a-zA-Z0-9-]/g, ''))
        .refine(str => str.length > 1),
    overwriteBranch: zod_1.z.boolean().optional(),
});
// console.log('the env => ', process.env);
console.log('context.eventName => ', github_1.context.eventName);
let branchNameInput;
if (github_1.context.eventName === 'pull_request') {
    branchNameInput = (_a = github_1.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.head.ref;
    console.log('branchNameInput for pull request => ', branchNameInput);
}
if (github_1.context.eventName === 'push') {
    branchNameInput = github_1.context.payload.ref;
    console.log('branchNameInput for push => ', branchNameInput);
}
const planetscaleInputs = planetscaleInputSchema.parse({
    orgName: process.env.PLANETSCALE_ORG_NAME,
    dbName: (0, core_1.getInput)('dbName') || process.env.PLANETSCALE_DB_NAME,
    serviceTokenId: process.env.PLANETSCALE_SERVICE_TOKEN_ID,
    serviceToken: process.env.PLANETSCALE_SERVICE_TOKEN,
    action: (0, core_1.getInput)('action'),
    parentBranchName: (0, core_1.getInput)('parentBranchName') || 'main',
    branchName: (0, core_1.getInput)('branchName') || branchNameInput,
});
const { orgName, dbName, serviceTokenId, serviceToken, branchName, parentBranchName, action, overwriteBranch, } = planetscaleInputs;
console.log('planetscaleInputs => ', planetscaleInputs);
const planetscaleBranchSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    restore_checklist_completed_at: zod_1.z.string(),
    access_host_url: zod_1.z.string(),
    schema_last_updated_at: zod_1.z.string(),
    mysql_address: zod_1.z.string(),
    mysql_edge_address: zod_1.z.string(),
    initial_restore_id: zod_1.z.string(),
    ready: zod_1.z.boolean(),
    production: zod_1.z.boolean(),
    sharded: zod_1.z.boolean(),
    shard_count: zod_1.z.number(),
    api_actor: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    restored_from_branch: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        created_at: zod_1.z.string(),
        updated_at: zod_1.z.string(),
        deleted_at: zod_1.z.string(),
    }),
    html_url: zod_1.z.string(),
    planetscale_region: zod_1.z.object({
        id: zod_1.z.string(),
        provider: zod_1.z.string(),
        enabled: zod_1.z.string(),
        public_ip_addresses: zod_1.z.array(zod_1.z.string()),
        display_name: zod_1.z.string(),
        location: zod_1.z.string(),
        slug: zod_1.z.string(),
    }),
    parent_branch: zod_1.z.string(),
    multiple_admins_required_for_demotion: zod_1.z.boolean(),
});
const planetscaleBranchStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    ready: zod_1.z.boolean(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
});
const planetscaleBranchPasswordResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    access_host_url: zod_1.z.string(),
    display_name: zod_1.z.string(),
    role: zod_1.z.string(),
    created_at: zod_1.z.string(),
    deleted_at: zod_1.z.string(),
    expires_at: zod_1.z.string(),
    ttl_seconds: zod_1.z.number(),
    actor: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    region: zod_1.z.object({
        id: zod_1.z.string(),
        provider: zod_1.z.string(),
        enabled: zod_1.z.string(),
        public_ip_addresses: zod_1.z.array(zod_1.z.string()),
        display_name: zod_1.z.string(),
        location: zod_1.z.string(),
        slug: zod_1.z.string(),
    }),
    username: zod_1.z.string(),
    renewable: zod_1.z.boolean(),
    database_branch: zod_1.z.object({
        name: zod_1.z.string(),
        id: zod_1.z.string(),
        production: zod_1.z.boolean(),
        access_host_url: zod_1.z.string(),
    }),
    integrations: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.string(),
        content: zod_1.z.object({
            plain: zod_1.z.string(),
            highlighted: zod_1.z.string(),
        }),
    })),
    plain_text: zod_1.z.string(),
});
const planetscaleCreateDeployRequestResponseSchema = zod_1.z.object({
    number: zod_1.z.number(),
    id: zod_1.z.string(),
    actor: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    closed_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch: zod_1.z.string(),
    branch_deleted: zod_1.z.boolean(),
    branch_deleted_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch_deleted_at: zod_1.z.string(),
    into_branch: zod_1.z.string(),
    into_branch_sharded: zod_1.z.boolean(),
    into_branch_shard_count: zod_1.z.number(),
    approved: zod_1.z.boolean(),
    state: zod_1.z.string(),
    deployment_state: zod_1.z.string(),
    html_url: zod_1.z.string(),
    notes: zod_1.z.string(),
    html_body: zod_1.z.string(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    closed_at: zod_1.z.string(),
    deployed_at: zod_1.z.string(),
    deployment: zod_1.z.object({
        id: zod_1.z.string(),
        auto_cutover: zod_1.z.boolean(),
        created_at: zod_1.z.string(),
        cutover_at: zod_1.z.string(),
        cutover_expiring: zod_1.z.boolean(),
        deploy_check_errors: zod_1.z.string(),
        finished_at: zod_1.z.string(),
        queued_at: zod_1.z.string(),
        ready_to_cutover_at: zod_1.z.string(),
        started_at: zod_1.z.string(),
        state: zod_1.z.string(),
        submitted_at: zod_1.z.string(),
        updated_at: zod_1.z.string(),
    }),
});
const planetscaleQueueDeployRequestResponseSchema = zod_1.z.object({
    number: zod_1.z.number(),
    id: zod_1.z.string(),
    actor: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    closed_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch: zod_1.z.string(),
    branch_deleted: zod_1.z.boolean(),
    branch_deleted_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch_deleted_at: zod_1.z.string(),
    into_branch: zod_1.z.string(),
    into_branch_sharded: zod_1.z.boolean(),
    into_branch_shard_count: zod_1.z.number(),
    approved: zod_1.z.boolean(),
    state: zod_1.z.string(),
    deployment_state: zod_1.z.string(),
    html_url: zod_1.z.string(),
    notes: zod_1.z.string(),
    html_body: zod_1.z.string(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    closed_at: zod_1.z.string(),
    deployed_at: zod_1.z.string(),
});
const planetscaleGetDeployRequestResponseSchema = zod_1.z.object({
    number: zod_1.z.number(),
    id: zod_1.z.string(),
    actor: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    closed_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch: zod_1.z.string(),
    branch_deleted: zod_1.z.boolean(),
    branch_deleted_by: zod_1.z.object({
        id: zod_1.z.string(),
        display_name: zod_1.z.string(),
        avatar_url: zod_1.z.string(),
    }),
    branch_deleted_at: zod_1.z.string(),
    into_branch: zod_1.z.string(),
    into_branch_sharded: zod_1.z.boolean(),
    into_branch_shard_count: zod_1.z.number(),
    approved: zod_1.z.boolean(),
    state: zod_1.z.string(),
    /* deployment_state is an enum of the following: pending ready no_changes queued submitting in_progress pending_cutover in_progress_vschema in_progress_cancel in_progress_cutover complete complete_cancel complete_error complete_pending_revert in_progress_revert complete_revert complete_revert_error cancelled error */
    deployment_state: zod_1.z.enum([
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
    html_url: zod_1.z.string(),
    notes: zod_1.z.string(),
    html_body: zod_1.z.string(),
    created_at: zod_1.z.string(),
    updated_at: zod_1.z.string(),
    closed_at: zod_1.z.string(),
    deployed_at: zod_1.z.string(),
    deployment: zod_1.z.object({
        id: zod_1.z.string(),
        auto_cutover: zod_1.z.boolean(),
        created_at: zod_1.z.string(),
        cutover_at: zod_1.z.string(),
        cutover_expiring: zod_1.z.boolean(),
        deploy_check_errors: zod_1.z.string(),
        finished_at: zod_1.z.string(),
        queued_at: zod_1.z.string(),
        ready_to_cutover_at: zod_1.z.string(),
        started_at: zod_1.z.string(),
        state: zod_1.z.string(),
        submitted_at: zod_1.z.string(),
        updated_at: zod_1.z.string(),
    }),
});
const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    Authorization: `${serviceTokenId}:${serviceToken}`,
};
// API FUNCTIONS
async function getBranch() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
    const options = { url, headers };
    const existingBranchData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        if (err.response.status === 404) {
            console.log('that branch does not exist.');
            return null;
        }
        throw err;
    });
    return planetscaleBranchSchema.parse(existingBranchData);
}
async function createBranch() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches`;
    const data = { name: branchName, parent_branch: parentBranchName };
    const options = { method: 'POST', url, headers, data };
    const newBranchData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw err;
    });
    return planetscaleBranchSchema.parse(newBranchData);
}
async function getBranchStatus() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
    const options = { method: 'GET', url, headers };
    const branchStatus = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        if (err.response.status === 404) {
            throw (0, console_1.error)('that branch does not exist.');
        }
        throw err;
    });
    return planetscaleBranchStatusResponseSchema.parse(branchStatus);
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
    const planetscalePasswordData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw err;
    });
    const passwordData = planetscaleBranchPasswordResponseSchema.parse(planetscalePasswordData);
    return `mysql://${passwordData.username}:${passwordData.plain_text}@${passwordData.access_host_url}/${dbName}?sslaccept=strict`;
}
async function createDeployRequest() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests`;
    const data = { branch: branchName, into_branch: parentBranchName };
    const options = { method: 'POST', url, headers, data };
    const deployRequestData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw err;
    });
    return planetscaleCreateDeployRequestResponseSchema.parse(deployRequestData).number;
}
async function queueDeployRequest(deployRequestNumber) {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}/deploy`;
    const options = { method: 'POST', url, headers };
    const deployRequestData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw err;
    });
    return planetscaleQueueDeployRequestResponseSchema.parse(deployRequestData).number;
}
async function getDeployRequestStatus(deployRequestNumber) {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/deploy-requests/${deployRequestNumber}`;
    const options = { method: 'GET', url, headers };
    const deployRequestData = await axios_1.default
        .request(options)
        .then(res => res.data)
        .catch(err => {
        throw err;
    });
    return planetscaleQueueDeployRequestResponseSchema.parse(deployRequestData).deployment_state;
}
async function waitForDeployRequestToComplete(deployRequestNumber) {
    const start = Date.now();
    const timeout = 300000;
    let backoff = 1000;
    while (Date.now() - start < timeout) {
        const deployRequestStatus = await getDeployRequestStatus(deployRequestNumber);
        console.log('deployRequestStatus => ', deployRequestStatus);
        if (deployRequestStatus === 'complete' ||
            deployRequestStatus === 'complete_pending_revert') {
            return 'complete';
        }
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff = backoff * 2;
    }
    throw new Error(`Deploy request failed to complete within ${timeout / 1000} seconds.`);
}
async function deleteBranch() {
    const url = `https://api.planetscale.com/v1/organizations/${orgName}/databases/${dbName}/branches/${branchName}`;
    const options = { method: 'DELETE', url, headers };
    return axios_1.default
        .request(options)
        .then(res => console.log('branch successfully deleted'))
        .catch(err => {
        throw err;
    });
}
// COMBINED FUNCTIONS
async function createBranchAndConnectionString() {
    const branch = await getBranch();
    if (branch && overwriteBranch)
        await deleteBranch();
    if (!branch || overwriteBranch) {
        const newBranch = await createBranch();
        console.log('new branch => ', newBranch);
    }
    const branchStatus = await waitForBranchToBeReady();
    console.log('branchStatus => ', branchStatus);
    const connectionString = await createConnectionString();
    console.log('connectionString => ', connectionString);
    (0, core_1.setOutput)('branch-name', branchName);
    (0, core_1.setOutput)('connection-string', connectionString);
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
// RUN THE ACTION
if (action === 'create')
    createBranchAndConnectionString();
if (action === 'deploy')
    createDeployRequestAndQueue();
if (action === 'delete')
    deleteBranch();
