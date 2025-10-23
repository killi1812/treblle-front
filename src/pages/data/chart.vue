<template>
  <v-container>
    <h1 class="mb-4">Realtime Request Statistics</h1>

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

    <!-- Display Raw Data (Optional for debugging) -->
    <!-- <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Raw Data Stream</v-card-title>
          <v-card-text>
            <pre>{{ chartSocketService.stats }}</pre>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row> -->

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { chartSocketService } from '@/api/server/chart'; // Adjust import path
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
  TimeScale, // Import TimeScale for time-based x-axis
  type ChartData,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter

// Register necessary Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale, // Register TimeScale
  Title,
  Tooltip,
  Legend
);

// --- Refs for Chart Instances and Canvases ---
const latencyChartCanvasRef = ref<HTMLCanvasElement | null>(null);
const errorChartCanvasRef = ref<HTMLCanvasElement | null>(null);
const latencyChartInstance = ref<Chart | null>(null);
const errorChartInstance = ref<Chart | null>(null);

const MAX_DATA_POINTS = 30; // Keep only the last N data points

// --- Reactive Data for Charts ---
const latencyChartData = ref<ChartData<'line', { x: number; y: number }[]>>({
  // Use point objects for time scale
  datasets: [{
    label: 'Average Latency (ms)',
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1,
    data: [], // Initialize empty
  }],
});

const errorChartData = ref<ChartData<'line', { x: number; y: number }[]>>({
  datasets: [
    {
      label: 'Client Errors (4xx)',
      borderColor: 'rgb(255, 159, 64)',
      tension: 0.1,
      data: [],
    },
    {
      label: 'Server Errors (5xx)',
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1,
      data: [],
    },
  ],
});

// --- Chart Configuration ---
const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time' as const, // Use time scale
      time: {
        unit: 'second' as const,
        tooltipFormat: 'PPpp', // Display format for tooltips (requires date-fns)
        displayFormats: {
          second: 'HH:mm:ss' // Display format on the axis
        }
      },
      title: {
        display: true,
        text: 'Time',
      },
      ticks: {
        maxTicksLimit: 10, // Limit number of ticks shown
      },
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Value',
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  animation: {
    duration: 500, // Optional: smoother updates
  }
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  chartSocketService.connect(); // Connect WebSocket

  // Wait for canvas elements to be available
  await nextTick();

  // Initialize Latency Chart
  if (latencyChartCanvasRef.value) {
    const latencyCtx = latencyChartCanvasRef.value.getContext('2d');
    if (latencyCtx) {
      latencyChartInstance.value = new Chart(latencyCtx, {
        type: 'line',
        data: latencyChartData.value,
        options: {
          ...commonChartOptions,
          scales: {
            ...commonChartOptions.scales,
            y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Latency (ms)' } },
          }
        }
      });
    }
  }

  // Initialize Error Chart
  if (errorChartCanvasRef.value) {
    const errorCtx = errorChartCanvasRef.value.getContext('2d');
    if (errorCtx) {
      errorChartInstance.value = new Chart(errorCtx, {
        type: 'line',
        data: errorChartData.value,
        options: {
          ...commonChartOptions,
          scales: {
            ...commonChartOptions.scales,
            y: { ...commonChartOptions.scales.y, title: { display: true, text: 'Count' } },
          }
        }
      });
    }
  }
});

onUnmounted(() => {
  chartSocketService.disconnect(); // Disconnect WebSocket
  // Destroy charts to prevent memory leaks
  latencyChartInstance.value?.destroy();
  errorChartInstance.value?.destroy();
});

watch(
  () => chartSocketService.stats.value, // Watch the reactive stats array
  (newDataPoints) => {
    if (!newDataPoints || newDataPoints.length === 0) {
      return; // No new data
    }

    // --- Update Latency Chart ---
    if (latencyChartInstance.value) {
      const dataset = latencyChartInstance.value.data.datasets[0].data;
      newDataPoints.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime(); // Convert to milliseconds for chart.js time scale
        dataset.push({ x: timestamp, y: point.averageLatencyMs });
        // Keep only the last MAX_DATA_POINTS
        if (dataset.length > MAX_DATA_POINTS) {
          dataset.shift();
        }
      });
      latencyChartInstance.value.update('none'); // Update without animation for real-time feel
    }

    // --- Update Error Chart ---
    if (errorChartInstance.value) {
      const clientErrors = errorChartInstance.value.data.datasets[0].data;
      const serverErrors = errorChartInstance.value.data.datasets[1].data;

      newDataPoints.forEach(point => {
        const timestamp = new Date(point.timestamp).getTime();
        clientErrors.push({ x: timestamp, y: point.clientErrorCount });
        serverErrors.push({ x: timestamp, y: point.serverErrorCount });

        if (clientErrors.length > MAX_DATA_POINTS) clientErrors.shift();
        if (serverErrors.length > MAX_DATA_POINTS) serverErrors.shift();
      });

      errorChartInstance.value.update('none');
    }
  },
  { deep: true } // Use deep watch if stats is an array/object being mutated
);

</script>

<style scoped>
/* Optional: Add some basic styling */
canvas {
  max-height: 300px;
  /* Limit chart height */
}
</style>
