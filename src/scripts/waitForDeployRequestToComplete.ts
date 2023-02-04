import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';
import { getDeployRequest } from '../endpoints/deployRequest';

export async function waitForDeployRequestToComplete(
	props: BranchActionProps & { deployRequestNumber: number }
) {
	const start = Date.now();
	const timeout = 300000;
	let backoff = 1000;

	while (Date.now() - start < timeout) {
		const deployRequest = await getDeployRequest(props);
		const deploymentStatus = deployRequest.deployment_state;
		console.log('deployRequestStatus => ', deploymentStatus);
		if (deploymentStatus === 'complete' || deploymentStatus === 'complete_pending_revert') {
			console.log('deploy request is complete!');
			setOutput('deploy-request-state', deployRequest.state);
			setOutput('deploy-request-deployment-state', deployRequest.deployment_state);
			return deployRequest;
		}
		
		await new Promise(resolve => setTimeout(resolve, backoff));
		backoff = backoff * 2;
	}

	throw new Error(`Deploy request failed to complete within ${timeout / 1000} seconds.`);
}
