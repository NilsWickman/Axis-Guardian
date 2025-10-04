<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Scatter } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { cn } from '@/lib/utils'

ChartJS.register(Title, Tooltip, Legend, PointElement, LinearScale)

interface Props {
  data: ChartData<'scatter'>
  options?: ChartOptions<'scatter'>
  class?: HTMLAttributes['class']
  id?: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
      },
      y: {
        type: 'linear' as const,
      },
    },
  }),
})
</script>

<template>
  <div data-slot="scatter-chart" :class="cn('relative', props.class)">
    <Scatter :id="id" :data="data" :options="options" :width="width" :height="height" />
  </div>
</template>
