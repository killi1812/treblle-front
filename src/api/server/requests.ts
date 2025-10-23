import type { ResDataDto } from "@/dto/resDataDto";
import serverApi from "./serverAxios";

export type TableOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: SortItem[];
};

export type SortItem = { key: string; order: 'asc' | 'desc' };

export type Filters = {
  startDate: string,
  endDate: string,
  method: string | null,
  response: number | null, // Use null for v-select clearable
  search: string,
}


export async function GetRequests(options: TableOptions, filters: Filters): Promise<ResDataDto> {
  const params = new URLSearchParams();

  // Pagination
  params.append('limit', String(options.itemsPerPage));
  params.append('offset', String((options.page - 1) * options.itemsPerPage));

  // Sorting
  if (options.sortBy.length > 0) {
    params.append('sort_by', options.sortBy[0]?.key ?? "");
    params.append('order', options.sortBy[0]?.order ?? "");
  } else {
    // Default sort if user clears sorting
    params.append('sort_by', 'created_at');
    params.append('order', 'desc');
  }

  // Filters
  if (filters.search) params.append('search', filters.search);
  if (filters.method) params.append('method', filters.method);

  // Handle response code filtering (adjust if backend handles ranges differently)
  if (filters.response !== null) {
    if (filters.response === 200) { // Example: Treat 200 as 2xx range start
      // Need backend support for range like response_gte=200&response_lt=300
      // For now, just sending the base code
      params.append('response', String(filters.response));
    } else if (filters.response === 300) {
      params.append('response', String(filters.response)); // Adjust for 3xx range
    } else if (filters.response === 400) {
      params.append('response', String(filters.response)); // Adjust for 4xx range
    } else if (filters.response === 500) {
      params.append('response', String(filters.response)); // Adjust for 5xx range
    } else {
      params.append('response', String(filters.response)); // Specific code
    }
  }
  // TODO: Add date range filtering - requires backend support
  if (filters.startDate) params.append('start_time', filters.startDate); // Adjust param name
  if (filters.endDate) params.append('end_time', filters.endDate);     // Adjust param name


  const response = await serverApi.get<ResDataDto>('/requests', { params });
  // const response = await serverApi.get<ResDataDto>('/requests');
  // TODO: check for errors

  return response.data
}
