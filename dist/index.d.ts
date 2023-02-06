declare const actionProps: {
    headers: {
        accept: string;
        'content-type': string;
        Authorization: string;
    };
    orgName: string;
    dbName: string;
    serviceTokenId: string;
    serviceToken: string;
    action: "create-branch" | "open-deploy-request" | "queue-deploy-request" | "delete-branch";
    parentBranchName: string;
    branchName: string;
    overwriteExistingBranch: boolean;
};
export type BranchActionProps = typeof actionProps;
export {};
