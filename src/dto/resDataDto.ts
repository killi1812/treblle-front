export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface RequestsDto {
  id: number;
  method: string;
  response: number;
  path: string;
  responseTime: string; // Keep as string as it's formatted in Go
  createdAt: string;    // Keep as string as it's formatted in Go
  latency: number;      // Latency in Milliseconds
}

export interface ResDataDto {
  data: RequestsDto[];
  pagination: Pagination;
}

