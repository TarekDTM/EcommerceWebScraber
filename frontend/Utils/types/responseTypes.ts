export type PaginatedResponse<T>  = {
    current_page: number,
    data: T[]
    per_page: number,

}