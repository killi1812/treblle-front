<template>
  <v-container fluid class="pa-8">
    <!-- Filter Section -->
    <v-card class="mb-6 pa-4" outlined>
      <v-row dense align="center">
        <!-- Date Range -->
        <v-col cols="12" md="3" sm="6">
          <v-text-field v-model="filters.startDate" label="Start Date" type="datetime-local" dense outlined hide-details
            clearable></v-text-field>
        </v-col>
        <v-col cols="12" md="3" sm="6">
          <v-text-field v-model="filters.endDate" label="End Date" type="datetime-local" dense outlined hide-details
            clearable></v-text-field>
        </v-col>

        <!-- Method Select -->
        <v-col cols="12" md="2" sm="4">
          <v-select v-model="filters.method" :items="methodOptions" label="Method" dense outlined hide-details
            clearable></v-select>
        </v-col>

        <!-- Response Select -->
        <v-col cols="12" md="2" sm="4">
          <!-- TODO: input number -->
          <v-select v-model="filters.response" :items="responseOptions" item-title="text" item-value="value"
            label="Response" dense outlined hide-details clearable></v-select>
        </v-col>

        <!-- Search -->
        <v-col cols="12" md="2" sm="4">
          <v-text-field v-model="filters.search" label="Search Path" prepend-inner-icon="mdi-magnify" dense outlined
            hide-details clearable @keydown.enter="applyFilters"></v-text-field>
        </v-col>

        <!-- Apply Button -->
        <v-col cols="12" class="text-right">
          <v-btn color="primary" @click="applyFilters" :loading="loading">
            Apply Filters
          </v-btn>
          <v-btn variant="text" @click="clearFilters" class="ml-2">
            Clear
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-data-table-server v-model:items-per-page="options.itemsPerPage" v-model:page="options.page"
      v-model:sort-by="options.sortBy" :headers="headers" :items="requests" :items-length="totalRequests"
      :loading="loading" class="elevation-1" item-value="id" @update:options="loadItems">
      <template v-slot:item.method="{ item }">
        <v-chip :color="getMethodColor(item.method)" dark small>
          {{ item.method }}
        </v-chip>
      </template>

      <template v-slot:item.response="{ item }">
        <v-chip :color="getResponseColor(item.response)" dark small>
          {{ item.response }}
        </v-chip>
      </template>

      <template v-slot:item.latency="{ item }">
        {{ item.latency }} ms
      </template>

      <template v-slot:item.createdAt="{ item }">
        {{ formatDateTime(item.createdAt) }}
      </template>

      <template v-slot:loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>

    </v-data-table-server>
  </v-container>
</template>

<script setup lang="ts">
import { GetRequests, type TableOptions } from '@/api/server/requests';
import type { RequestsDto } from '@/dto/resDataDto';
import { reactive, ref } from 'vue';
import type { VDataTableServer } from 'vuetify/components';


// Types for table options
// --- Refs and Reactive State ---

const requests = ref<RequestsDto[]>([]);
const totalRequests = ref(0);
const loading = ref(true);

// Filters - use reactive for grouping filter-related refs
const filters = reactive({
  startDate: '',
  endDate: '',
  method: null as string | null, // Use null for v-select clearable
  response: null as number | null, // Use null for v-select clearable
  search: '',
});

// Table options (pagination, sorting)
const options = ref<TableOptions>({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: 'createdAt', order: 'desc' }], // Default sort
});

// --- Table Headers ---

const headers = [
  { title: 'Method', key: 'method', sortable: false, width: '5%' },
  { title: 'Response', key: 'response', sortable: false, width: '5%' },
  { title: 'Path', key: 'path', sortable: false, width: '30%' },
  { title: 'Response Time (ms)', key: 'latency', sortable: true, width: '5%' },
  { title: 'Created At', key: 'createdAt', sortable: true, width: '24%' },
  { title: 'Response At', key: 'responseTime', sortable: true, width: '24%' },
];

// --- Filter Options ---

const methodOptions: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
const responseOptions = [
  { text: 'Any', value: null },
  { text: '2xx Success', value: 200 },
  { text: '3xx Redirection', value: 300 },
  { text: '4xx Client Error', value: 400 },
  { text: '5xx Server Error', value: 500 },
  // You could add specific codes too: { text: '404 Not Found', value: 404 }
];


// --- Methods ---

// Fetch data from the API
const loadItems = async () => {
  loading.value = true;
  try {
    const rez = await GetRequests(options.value, filters)
    requests.value = rez.data
    totalRequests.value = rez.pagination.total
  } catch (error) {
    console.error("Failed to load requests:", error);
    // TODO: Show error message to user (e.g., using a snackbar)
    requests.value = [];
    totalRequests.value = 0;
  } finally {
    loading.value = false;
  }
};

// Trigger reload when filters are applied
const applyFilters = () => {
  options.value.page = 1; // Reset to first page when filters change
  loadItems();
};

// Clear all filters and reload
const clearFilters = () => {
  filters.startDate = '';
  filters.endDate = '';
  filters.method = null;
  filters.response = null;
  filters.search = '';
  applyFilters(); // Reload data with cleared filters
};


// --- Computed & Watchers ---

// Watch for changes in options (page, itemsPerPage, sortBy) to trigger data loading
// The VDataTableServer emits @update:options which calls loadItems directly,
// so explicitly watching options might be redundant unless you need side effects.
// watch(options, loadItems, { deep: true }); // Keep if needed for other reasons

// --- Helper Functions ---

const getMethodColor = (method: string): string => {
  switch (method?.toUpperCase()) {
    case 'GET': return 'blue';
    case 'POST': return 'green';
    case 'PUT': return 'orange';
    case 'DELETE': return 'red';
    case 'PATCH': return 'purple';
    case 'OPTIONS': return 'grey';
    case 'HEAD': return 'teal';
    default: return 'black';
  }
};

const getResponseColor = (responseCode: number): string => {
  if (responseCode >= 200 && responseCode < 300) return 'green';
  if (responseCode >= 300 && responseCode < 400) return 'blue';
  if (responseCode >= 400 && responseCode < 500) return 'orange';
  if (responseCode >= 500) return 'red';
  return 'grey';
};

const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '-';
  try {
    // Assuming the backend sends a format JS Date can parse (like ISO 8601)
    const date = new Date(dateTimeString);
    // Use Intl.DateTimeFormat for locale-aware formatting
    return new Intl.DateTimeFormat(undefined, { // Use browser's default locale
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(date);
    // Basic formatting if Intl is not desired:
    // return date.toLocaleString();
  } catch (e) {
    return dateTimeString; // Return original if parsing fails
  }
};

// --- Initial Load ---
// loadItems() is called automatically by VDataTableServer via @update:options on mount

</script>

<style scoped></style>
