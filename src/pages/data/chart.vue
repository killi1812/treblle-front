<template>
  <v-container>
    <h1 class="mb-4">Realtime Request Statistics
      <v-btn icon="mdi-refresh" @click="chartSocketService.refresh()" />
    </h1>
    <v-row>
      <!-- Latency Chart -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Average Latency (ms)</v-card-title>
          <v-card-text>
            <canvas ref="latencyChartCanvasRef"></canvas>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Error Counts Chart -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Error Counts</v-card-title>
          <v-card-text>
            <canvas ref="errorChartCanvasRef"></canvas>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- request Counts Chart -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue';
// Assuming chartSocketService provides stats as Ref<RequestStatistics | null>
import { chartSocketService } from '@/api/server/chart'; // Adjust import path
import type { RequestStatistics } from '@/dto/statisticsDto'; // Adjust DTO import path
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register necessary Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

// --- Refs for Chart Instances and Canvases ---
const latencyChartCanvasRef = ref<HTMLCanvasElement | null>(null);
const errorChartCanvasRef = ref<HTMLCanvasElement | null>(null);
// Use shallowRef for chart instances as their internal state isn't reactive
const latencyChartInstance = shallowRef<Chart | null>(null);
const errorChartInstance = shallowRef<Chart | null>(null);


const MAX_DATA_POINTS = 30; // Keep only the last N data points

// --- Reactive Data (Internal History) ---
const statsHistory = ref<{ timestamp: number; latency: number; clientErrors: number; serverErrors: number }[]>([]);

// --- Chart Configuration ---
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time' as const,
      time: {
        unit: 'second' as const,
        tooltipFormat: 'PPpp', // date-fns format
        displayFormats: {
          second: 'HH:mm:ss',
        },
      },
      title: { display: true, text: 'Time' },
      ticks: { maxTicksLimit: 10, source: 'auto' as const }, // Use 'auto' source
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Value' },
    },
  },
  plugins: {
    legend: { position: 'top' as const },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  // Disable animation for smoother real-time feel, or keep a short duration
  animation: false as const, // or { duration: 200 }
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  chartSocketService.connect();

  await nextTick();

  // Initialize Latency Chart
  if (latencyChartCanvasRef.value) {
    const latencyCtx = latencyChartCanvasRef.value.getContext('2d');
    if (latencyCtx) {
      latencyChartInstance.value = new Chart(latencyCtx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Average Latency (ms)',
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            data: [], // Initial empty data
          }],
        },
        options: {
          ...commonChartOptions,
          scales: { ...commonChartOptions.scales, y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Latency (ms)' } } }
        }
      });
    } else {
      console.error("Failed to get 2D context for latency chart");
    }
  } else {
    console.error("Latency chart canvas ref not found");
  }

  // Initialize Error Chart
  if (errorChartCanvasRef.value) {
    const errorCtx = errorChartCanvasRef.value.getContext('2d');
    if (errorCtx) {
      errorChartInstance.value = new Chart(errorCtx, {
        type: 'line',
        data: {
          datasets: [
            { label: 'Client Errors (4xx)', borderColor: 'rgb(255, 159, 64)', tension: 0.1, data: [] },
            { label: 'Server Errors (5xx)', borderColor: 'rgb(255, 99, 132)', tension: 0.1, data: [] },
          ],
        },
        options: {
          ...commonChartOptions,
          scales: { ...commonChartOptions.scales, y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Count' } } }
        }
      });
    } else {
      console.error("Failed to get 2D context for error chart");
    }
  } else {
    console.error("Error chart canvas ref not found");
  }
});

onBeforeUnmount(() => {
  console.log("Component unmounting...");
  // Disconnect WebSocket first
  try {
    chartSocketService.disconnect();
    console.log("WebSocket disconnected.");
  } catch (error) {
    console.error("Error during WebSocket disconnection:", error);
  }

  // Safely destroy charts
  if (latencyChartInstance.value) {
    try {
      console.log("Attempting to destroy latency chart...");
      latencyChartInstance.value.destroy();
      console.log("Latency chart destroyed.");
      latencyChartInstance.value = null; // Clear the ref
    } catch (error) {
      console.error("Error destroying latency chart:", error);
    }
  } else {
    console.log("Latency chart instance was already null on unmount.");
  }

  if (errorChartInstance.value) {
    try {
      console.log("Attempting to destroy error chart...");
      errorChartInstance.value.destroy();
      console.log("Error chart destroyed.");
      errorChartInstance.value = null; // Clear the ref
    } catch (error) {
      console.error("Error destroying error chart:", error);
    }
  } else {
    console.log("Error chart instance was already null on unmount.");
  }
  console.log("Component unmount finished.");
});

// --- Watch for Data Updates ---
watch(
  () => chartSocketService.stats.value, // Watch the reactive stats ref from the service
  (newStatsSnapshot: RequestStatistics | undefined) => {
    if (!newStatsSnapshot)
      return;


    statsHistory.value.push({
      timestamp: newStatsSnapshot.timestamp ?? Date.now(),
      latency: newStatsSnapshot.average_latency_ms ?? 0,
      clientErrors: newStatsSnapshot.client_error_count ?? 0,
      serverErrors: newStatsSnapshot.server_error_count ?? 0,
    });

    if (statsHistory.value.length > MAX_DATA_POINTS) {
      statsHistory.value.shift();
    }

    // --- Update Latency Chart ---
    if (latencyChartInstance.value) {
      latencyChartInstance.value.data.datasets[0]!.data = statsHistory.value.map(p => ({ x: p.timestamp, y: p.latency }));
      latencyChartInstance.value.update(); // Let Chart.js handle animation based on options
    } else {
      console.log("Latency chart instance not ready for update.");
    }

    // --- Update Error Chart ---
    if (errorChartInstance.value) {
      errorChartInstance.value.data.datasets[0]!.data = statsHistory.value.map(p => ({ x: p.timestamp, y: p.clientErrors }));
      errorChartInstance.value.data.datasets[1]!.data = statsHistory.value.map(p => ({ x: p.timestamp, y: p.serverErrors }));
      errorChartInstance.value.update();
    } else {
      console.log("Error chart instance not ready for update.");
    }
  },
  { deep: true }
);

</script>

<style scoped>
canvas {
  max-height: 300px;
  width: 100%;
}
</style>
