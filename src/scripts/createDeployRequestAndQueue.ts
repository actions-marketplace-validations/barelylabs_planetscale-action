import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';
import { createDeployRequest, queueDeployRequest } from '../endpoints/deployRequest';
import { waitForDeployRequestToBeSafe } from './waitForDeployRequestSchemaCheck';
import { waitForDeployRequestToComplete } from './waitForDeployRequestToComplete';

export async function createDeployRequestAndQueue(props: BranchActionProps) {
	const deployRequestNumber = await createDeployRequest(props);
	console.log('deployRequestCreated reqNumber => ', deployRequestNumber);

	await waitForDeployRequestToBeSafe({ ...props, deployRequestNumber });

	const queuedDeployRequestNumber = await queueDeployRequest({
		...props,
		deployRequestNumber,
	});
	console.log('deployRequest queued to merge with main => ', queuedDeployRequestNumber);

	await waitForDeployRequestToComplete({
		...props,
		deployRequestNumber: queuedDeployRequestNumber,
	});

	console.log('deploy request complete');

	setOutput('branch-name', props.branchName);
	setOutput('deploy-request-number', queuedDeployRequestNumber);
	setOutput('deploy-request-status', 'complete');

	return queuedDeployRequestNumber;
}
