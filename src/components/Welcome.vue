<template>
  <v-container>
    <h1 class="text-h4 mb-4">API Statistics
      <v-btn icon="mdi-refresh" @click="fetchStats" />
    </h1>
    <v-alert v-if="error" type="error" prominent border="start" class="mb-4">
      Failed to load statistics: {{ error }}
    </v-alert>

    <div v-if="isLoading" class="text-center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-2">Loading statistics...</p>
    </div>

    <v-row v-if="!isLoading && stats && aggregatedStats">
      <v-col cols="12" md="3">
        <v-card class="pa-3 text-center" elevation="2">
          <v-card-subtitle>Total Requests</v-card-subtitle>
          <v-card-title class="text-h4">{{ aggregatedStats.totalRequests }}</v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-3 text-center" elevation="2">
          <v-card-subtitle>Avg. Latency</v-card-subtitle>
          <v-card-title class="text-h4">
            {{ aggregatedStats.averageLatencyMs.toFixed(2) }} ms
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-3 text-center" color="orange-lighten-5" elevation="2">
          <v-card-subtitle>Client Errors (4xx)</v-card-subtitle>
          <v-card-title class="text-h4 text-orange-darken-3">{{ aggregatedStats.clientErrorCount }}</v-card-title>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-3 text-center" color="red-lighten-5" elevation="2">
          <v-card-subtitle>Server Errors (5xx)</v-card-subtitle>
          <v-card-title class="text-h4 text-red-darken-3">{{ aggregatedStats.serverErrorCount }}</v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Optional: Display per-path details -->
    <v-row v-if="!isLoading && stats && stats.requests_per_path.length > 0" class="mt-6">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title>Requests per Path
          </v-card-title>
          <v-divider></v-divider>
          <v-list lines="two">
            <v-list-item v-for="pathStat in stats.requests_per_path" :key="pathStat.path" :title="pathStat.path">
              <template v-slot:subtitle>
                <div class="mt-4 mb-4 d-flex ga-1">
                  <v-chip>
                    Count: {{ pathStat.request_count }}
                  </v-chip>
                  <v-chip>
                    Avg Latency: {{ pathStat.average_latency_ms.toFixed(2) }} ms
                  </v-chip>
                  <v-chip>
                    4xx: {{ pathStat.client_error_count }}
                  </v-chip>
                  <v-chip>
                    5xx: {{ pathStat.server_error_count }}
                  </v-chip>
                </div>
              </template>
              <v-divider
                v-if="stats.requests_per_path.indexOf(pathStat) < stats.requests_per_path.length - 1"></v-divider>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import serverApi from '@/api/server/serverAxios'; // Adjust import path if needed
import type { RequestStatistics } from '@/dto/statisticsDto';

const stats = ref<RequestStatistics | null>(null);
const isLoading = ref<boolean>(true);
const error = ref<string | null>(null);

// Calculate aggregated stats from the per-path data
const aggregatedStats = computed(() => {
  if (!stats.value?.requests_per_path) {
    return {
      totalRequests: 0,
      averageLatencyMs: 0,
      clientErrorCount: 0,
      serverErrorCount: 0,
    };
  }

  let totalRequests = 0;
  let totalLatencySum = 0;
  let clientErrors = 0;
  let serverErrors = 0;

  stats.value.requests_per_path.forEach((pathStat: { request_count: number; average_latency_ms: number; client_error_count: number; server_error_count: number; }) => {
    totalRequests += pathStat.request_count;
    // Weighted average: (count * avg_latency) for each path
    totalLatencySum += pathStat.request_count * pathStat.average_latency_ms;
    clientErrors += pathStat.client_error_count;
    serverErrors += pathStat.server_error_count;
  });

  return {
    totalRequests,
    // Calculate overall average latency (avoid division by zero)
    averageLatencyMs: totalRequests > 0 ? totalLatencySum / totalRequests : 0,
    clientErrorCount: clientErrors,
    serverErrorCount: serverErrors,
  };
});


async function fetchStats() {
  isLoading.value = true;
  error.value = null;
  stats.value = null;

  try {
    const response = await serverApi.get<RequestStatistics>('/requests/statistics');
    stats.value = response.data;
    console.log('Stats received:', stats.value);
  } catch (err: any) {
    console.error('Error fetching statistics:', err);
    error.value = err.response?.data?.error || err.message || 'An unknown error occurred';
    stats.value = {} as RequestStatistics;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.v-card-title.text-h4 {
  font-weight: bold;
}

.v-card-subtitle {
  font-size: 0.9em;
  color: grey;
}
</style>
