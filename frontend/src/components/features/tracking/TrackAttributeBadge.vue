<script setup lang="ts">
/**
 * TrackAttributeBadge - Compact display of track clothing attributes
 *
 * Shows colored dots representing upper and lower clothing colors.
 * Hover to see detailed color names and confidence scores.
 */
import { computed } from 'vue'
import type { TrackAttributes, ColorScore } from '@/stores/globalTracks'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps<{
  attributes?: TrackAttributes
  /** Show detailed view with text labels */
  detailed?: boolean
}>()

// Map color names to CSS colors
const colorMap: Record<string, string> = {
  black: '#171717',
  white: '#f5f5f5',
  gray: '#6b7280',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  brown: '#78350f',
  beige: '#d4c4a8',
  navy: '#1e3a5a',
  cyan: '#06b6d4',
}

const upperColors = computed<ColorScore[]>(() =>
  props.attributes?.upper_clothing?.dominant_colors?.slice(0, 2) ?? []
)

const lowerColors = computed<ColorScore[]>(() =>
  props.attributes?.lower_clothing?.dominant_colors?.slice(0, 2) ?? []
)

const upperType = computed(() => props.attributes?.upper_clothing?.type)
const lowerType = computed(() => props.attributes?.lower_clothing?.type)

const hasData = computed(() =>
  upperColors.value.length > 0 || lowerColors.value.length > 0
)

function getColorStyle(name: string): string {
  return colorMap[name.toLowerCase()] ?? '#94a3b8'
}

function formatTooltip(colors: ColorScore[], type?: { name: string; score: number }): string {
  const colorText = colors
    .map(c => `${c.name} (${Math.round(c.score * 100)}%)`)
    .join(', ')
  if (type) {
    return `${type.name}: ${colorText}`
  }
  return colorText
}
</script>

<template>
  <div v-if="hasData" class="flex items-center gap-1">
    <TooltipProvider>
      <!-- Upper clothing colors -->
      <Tooltip v-if="upperColors.length > 0">
        <TooltipTrigger as-child>
          <div class="flex gap-0.5">
            <div
              v-for="color in upperColors"
              :key="color.name"
              :style="{ backgroundColor: getColorStyle(color.name) }"
              class="w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">
          <p>Upper: {{ formatTooltip(upperColors, upperType) }}</p>
        </TooltipContent>
      </Tooltip>

      <!-- Separator -->
      <span v-if="upperColors.length > 0 && lowerColors.length > 0" class="text-muted-foreground text-[10px]">/</span>

      <!-- Lower clothing colors -->
      <Tooltip v-if="lowerColors.length > 0">
        <TooltipTrigger as-child>
          <div class="flex gap-0.5">
            <div
              v-for="color in lowerColors"
              :key="color.name"
              :style="{ backgroundColor: getColorStyle(color.name) }"
              class="w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">
          <p>Lower: {{ formatTooltip(lowerColors, lowerType) }}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <!-- Detailed view with text labels -->
    <template v-if="detailed">
      <div class="ml-2 text-xs text-muted-foreground space-y-0.5">
        <div v-if="upperColors.length > 0" class="flex items-center gap-1">
          <span class="text-[10px] uppercase tracking-wider opacity-60">Upper:</span>
          <span>{{ upperColors.map(c => c.name).join(', ') }}</span>
          <span v-if="upperType" class="opacity-60">({{ upperType.name }})</span>
        </div>
        <div v-if="lowerColors.length > 0" class="flex items-center gap-1">
          <span class="text-[10px] uppercase tracking-wider opacity-60">Lower:</span>
          <span>{{ lowerColors.map(c => c.name).join(', ') }}</span>
          <span v-if="lowerType" class="opacity-60">({{ lowerType.name }})</span>
        </div>
        <div v-if="attributes?.sample_count" class="text-[10px] opacity-50">
          {{ attributes.sample_count }} samples
        </div>
      </div>
    </template>
  </div>
</template>
