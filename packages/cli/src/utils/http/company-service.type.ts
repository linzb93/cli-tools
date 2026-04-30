export interface PaginationParms {
    pageSize: number;
    pageIndex: number;
}

export interface PaginationResponse<T> extends PaginationParms {
    list: T[];
    totalCount: number;
    totalPages: number;
}
