import { BranchActionProps } from '..';
export declare function openDeployRequest(props: BranchActionProps): Promise<{
    created_at?: string | null | undefined;
    updated_at?: string | null | undefined;
    deployed_at?: string | null | undefined;
    number: number;
    id: string;
    branch: string;
    state: "open" | "closed";
    deployment_state: "error" | "pending" | "ready" | "no_changes" | "queued" | "submitting" | "in_progress" | "pending_cutover" | "in_progress_vschema" | "in_progress_cancel" | "in_progress_cutover" | "complete" | "complete_cancel" | "complete_error" | "complete_pending_revert" | "in_progress_revert" | "complete_revert" | "complete_revert_error" | "cancelled";
}>;
