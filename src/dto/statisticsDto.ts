import type { RequestsDto, Pagination } from "./resDataDto"


export interface RequestStatistics {
  request_count: number
  average_latency_ms: number
  client_error_count: number
  server_error_count: number
  requests_per_path: PathStatistics[]
  timestamp: number;
}

export interface PathStatistics {
  path: string
  request_count: number
  average_latency_ms: number
  client_error_count: number
  server_error_count: number
  timestamp: number;
}

