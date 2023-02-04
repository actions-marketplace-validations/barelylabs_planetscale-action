import { BranchActionProps } from '..';
import { getDeployRequest } from '../endpoints/deployRequest';

export async function waitForDeployRequestToBeSafe(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const deployRequestStatus = (await getDeployRequest(props)).deployment_state;
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
