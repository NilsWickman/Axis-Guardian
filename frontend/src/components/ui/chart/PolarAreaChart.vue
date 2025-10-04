<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PolarArea } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { cn } from '@/lib/utils'

ChartJS.register(Title, Tooltip, Legend, ArcElement, RadialLinearScale)

interface Props {
  data: ChartData<'polarArea'>
  options?: ChartOptions<'polarArea'>
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
      r: {
        ticks: {
          display: false,
        },
      },
    },
  }),
})
</script>

<template>
  <div data-slot="polar-area-chart" :class="cn('relative', props.class)">
    <PolarArea :id="id" :data="data" :options="options" :width="width" :height="height" />
  </div>
</template>
