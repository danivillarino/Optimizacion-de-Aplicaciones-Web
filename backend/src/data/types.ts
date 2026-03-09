export interface PageRequest {
    page: number;
    size: number;
    order: string;
    orderBy: string;
}

export interface PageResponse<T> {
    items: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
}
