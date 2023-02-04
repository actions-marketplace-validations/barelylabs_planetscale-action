import { BranchActionProps } from '..';
import { getDeployRequest } from '../endpoints/deployRequest';

export async function waitForDeployRequestToComplete(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	const start = Date.now();
	const timeout = 300000;
	let backoff = 1000;

	while (Date.now() - start < timeout) {
		const deployRequestStatus = (await getDeployRequest(props)).deployment_state;
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
