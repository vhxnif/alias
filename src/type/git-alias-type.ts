export interface IGitAlias {
    log: (limit: number, author?: string) => Promise<void>
    status: () => Promise<void>
    push: () => Promise<void>
    pull: () => Promise<void>
    branchList: (name?: string, isListAll?: boolean) => Promise<void>
    branchCheckout: (name?: string) => Promise<void>
    branchMerge: (name?: string) => Promise<void>
    branchRebase: (name?: string) => Promise<void>
    branchDelete: (name?: string) => Promise<void>
    branchNew: (name: string, origin: boolean) => Promise<void>
    stashList: () => Promise<void>
    stashAdd: (name: string) => Promise<void>
    stashPop: () => Promise<void>
    stashDrop: () => Promise<void>
    stashShow: () => Promise<void>
    stashApply: () => Promise<void>
    add: () => Promise<void>
    restore: () => Promise<void>
    commit: () => Promise<void>
    rollbackFileChanges: () => Promise<void>

}