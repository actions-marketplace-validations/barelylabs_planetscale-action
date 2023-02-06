import { BranchActionProps } from '../';
export declare function getBranch({ orgName, dbName, branchName, headers }: BranchActionProps): Promise<{
    id: string;
    ready: boolean;
    created_at: string;
    updated_at: string;
    name: string;
} | null>;
export declare function createBranch(props: BranchActionProps & {
    parentBranchName: string;
}): Promise<{
    id: string;
    ready: boolean;
    created_at: string;
    updated_at: string;
    name: string;
}>;
export declare function deleteBranch({ orgName, dbName, branchName, headers, }: BranchActionProps): Promise<void>;
