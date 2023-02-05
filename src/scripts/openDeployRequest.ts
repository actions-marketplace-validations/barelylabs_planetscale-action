import { setOutput } from '@actions/core';
import { BranchActionProps } from '..';
import { createDeployRequest, getAllDeployRequests } from '../endpoints/deployRequest';

export async function openDeployRequest(props: BranchActionProps) {
	const allDeployRequests = await getAllDeployRequests(props);
	const mostRecentDeployRequest = allDeployRequests.find(
		req => req.branch === props.branchName
	);

	if (mostRecentDeployRequest?.state === 'open') {
		console.log('deploy request already open');

		setOutput('branch-name', props.branchName);
		setOutput('deploy-request-number', mostRecentDeployRequest.number);
		setOutput('deploy-request-status', 'open');
		return mostRecentDeployRequest;
	}

	const newDeployRequest = await createDeployRequest(props);

	setOutput('branch-name', props.branchName);
	setOutput('deploy-request-number', newDeployRequest.number);
	setOutput('deploy-request-status', 'complete');

	return newDeployRequest;
}
