import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';

import {
	createDeployRequest,
	getAllDeployRequests,
	queueDeployRequest,
} from '../endpoints/deployRequest';

import { waitForDeployRequestToBeReady } from './waitForDeployRequestToBeReady';
import { waitForDeployRequestToComplete } from './waitForDeployRequestToComplete';

export async function queueMostRecentDeployRequest(props: BranchActionProps) {
	const allDeployRequests = await getAllDeployRequests(props);
	const mostRecentDeployRequest = allDeployRequests.find(
		req => req.branch === props.branchName
	);

	let deployRequestNumber = mostRecentDeployRequest?.number;

	if (!deployRequestNumber || mostRecentDeployRequest?.state === 'closed') {
		console.log('no existing deploy request for that branch. we need to create one.');
		const newDeployRequest = await createDeployRequest(props);
		deployRequestNumber = newDeployRequest.number;
	}

	setOutput('deploy-request-number', deployRequestNumber);

	await waitForDeployRequestToBeReady({ ...props, deployRequestNumber });
	await queueDeployRequest({ ...props, deployRequestNumber });
	await waitForDeployRequestToComplete({ ...props, deployRequestNumber });
}
