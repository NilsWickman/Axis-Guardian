<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { cn } from '@/lib/utils'

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, RadialLinearScale, Filler)

interface Props {
  data: ChartData<'radar'>
  options?: ChartOptions<'radar'>
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
    elements: {
      line: {
        borderWidth: 3,
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
  <div data-slot="radar-chart" :class="cn('relative', props.class)">
    <Radar :id="id" :data="data" :options="options" :width="width" :height="height" />
  </div>
</template>
