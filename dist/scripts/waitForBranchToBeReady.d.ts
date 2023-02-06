import { BranchActionProps } from '..';
export declare function waitForBranchToBeReady(actionProps: BranchActionProps): Promise<{
    id: string;
    ready: boolean;
    created_at: string;
    updated_at: string;
    name: string;
}>;
