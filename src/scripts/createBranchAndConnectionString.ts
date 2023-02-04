import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';
import { createBranch, deleteBranch, getBranch } from '../endpoints/branch';
import { createConnectionString } from '../endpoints/branchPassword';
import { waitForBranchToBeReady } from './waitForBranchToBeReady';

export async function createBranchAndConnectionString(props: BranchActionProps) {
	const branch = await getBranch(props);

	if (branch && props.overwriteBranch) {
		console.log('deleting branch...');
		await deleteBranch(props);
	}

	if (!branch || props.overwriteBranch) {
		const newBranch = await createBranch(props);
		console.log('new branch => ', newBranch);
	}

	const branchStatus = await waitForBranchToBeReady(props);
	console.log('branchStatus => ', branchStatus);
	setOutput('branch-status', branchStatus);

	const connectionString = await createConnectionString(props);
	console.log('connectionString => ', connectionString);
	setOutput('connection-string', connectionString);

	return connectionString;
}
