import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';
import { getDeployRequest } from '../endpoints/deployRequest';

export async function waitForDeployRequestToBeReady(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	let timeout = 300000;
	let backoff = 1000;
	let start = Date.now();

	while (Date.now() - start < timeout) {
		const deployRequest = await getDeployRequest(props);
		const deployRequestStatus = deployRequest.deployment_state;
		console.log('deployRequestStatus => ', deployRequestStatus);

		if (deployRequestStatus === 'ready') {
			console.log('deploy request is ready!');
			setOutput('deploy-request-state', deployRequest.state);
			setOutput('deploy-request-deployment-state', deployRequest.deployment_state);
			return deployRequest;
		}

		if (deployRequestStatus === 'cancelled' || deployRequestStatus === 'error') {
			setOutput('deploy-request-state', deployRequest.state);
			setOutput('deploy-request-deployment-state', deployRequest.deployment_state);
			throw new Error('Deploy request failed');
		}

		console.log('currently validating that these changes are safe to deploy.');
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}
	throw new Error('Deploy request failed');
}
