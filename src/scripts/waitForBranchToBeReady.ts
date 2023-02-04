import { BranchActionProps } from '..';
import { getBranch } from '../endpoints/branch';

export async function waitForBranchToBeReady(actionProps: BranchActionProps) {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const branch = await getBranch(actionProps);

		if (branch?.ready) {
			console.log('branch is ready!');
			return branch;
		}
		console.log('branch is not ready yet, waiting...');
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Branch failed to be ready');
}
