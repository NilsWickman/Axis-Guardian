import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { PolarAreaChart, RadarChart, ScatterChart } from '@/components/ui/chart'
import type { ChartData, ChartOptions } from 'chart.js'

// Mock data for different chart scenarios
const mockChartData = {
  polarArea: {
    basic: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
      datasets: [
        {
          label: 'Basic Dataset',
          data: [11, 16, 7, 3, 14],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 205, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    } as ChartData<'polarArea'>,
    sales: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Sales Performance',
          data: [450, 620, 380, 720],
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(251, 191, 36, 0.6)',
            'rgba(239, 68, 68, 0.6)',
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    } as ChartData<'polarArea'>,
    budget: {
      labels: ['Marketing', 'Development', 'Sales', 'Support', 'Operations'],
      datasets: [
        {
          label: 'Budget Allocation (in thousands)',
          data: [120, 200, 150, 80, 100],
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 101, 101, 0.7)',
            'rgba(251, 146, 60, 0.7)',
            'rgba(168, 85, 247, 0.7)',
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 101, 101, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(168, 85, 247, 1)',
          ],
          borderWidth: 2,
        },
      ],
    } as ChartData<'polarArea'>,
  },
  radar: {
    skills: {
      labels: ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Node.js', 'CSS'],
      datasets: [
        {
          label: 'Frontend Developer',
          data: [90, 85, 95, 75, 60, 88],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        },
        {
          label: 'Backend Developer',
          data: [70, 80, 40, 30, 95, 65],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 99, 132, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        },
      ],
    } as ChartData<'radar'>,
    performance: {
      labels: ['Speed', 'Reliability', 'Security', 'Scalability', 'Usability'],
      datasets: [
        {
          label: 'Current System',
          data: [78, 85, 92, 65, 88],
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 3,
          fill: true,
        },
        {
          label: 'Target Goals',
          data: [90, 95, 95, 85, 92],
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 3,
          fill: true,
        },
      ],
    } as ChartData<'radar'>,
    satisfaction: {
      labels: ['Quality', 'Price', 'Support', 'Delivery', 'Features', 'Experience'],
      datasets: [
        {
          label: 'Customer Satisfaction',
          data: [4.2, 3.8, 4.5, 4.1, 3.9, 4.3],
          backgroundColor: 'rgba(139, 92, 246, 0.3)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    } as ChartData<'radar'>,
  },
  scatter: {
    basic: {
      datasets: [
        {
          label: 'Dataset 1',
          data: [
            { x: -10, y: 0 },
            { x: 0, y: 10 },
            { x: 10, y: 5 },
            { x: 0.5, y: 5.5 },
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          pointRadius: 5,
        },
        {
          label: 'Dataset 2',
          data: [
            { x: -5, y: -5 },
            { x: 5, y: -10 },
            { x: 15, y: -5 },
            { x: 8, y: -8 },
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 5,
        },
      ],
    } as ChartData<'scatter'>,
    correlation: {
      datasets: [
        {
          label: 'Revenue vs Marketing Spend',
          data: [
            { x: 10, y: 20 },
            { x: 15, y: 35 },
            { x: 20, y: 45 },
            { x: 25, y: 50 },
            { x: 30, y: 65 },
            { x: 35, y: 70 },
            { x: 40, y: 85 },
            { x: 45, y: 90 },
            { x: 50, y: 105 },
          ],
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    } as ChartData<'scatter'>,
    performance: {
      datasets: [
        {
          label: 'Server Response Time',
          data: [
            { x: 100, y: 250 },
            { x: 200, y: 180 },
            { x: 300, y: 220 },
            { x: 400, y: 160 },
            { x: 500, y: 140 },
            { x: 600, y: 120 },
            { x: 700, y: 200 },
            { x: 800, y: 90 },
          ],
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          pointRadius: 7,
        },
        {
          label: 'Database Query Time',
          data: [
            { x: 100, y: 50 },
            { x: 200, y: 45 },
            { x: 300, y: 60 },
            { x: 400, y: 40 },
            { x: 500, y: 35 },
            { x: 600, y: 30 },
            { x: 700, y: 55 },
            { x: 800, y: 25 },
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 7,
        },
      ],
    } as ChartData<'scatter'>,
  },
}

// Chart options for different scenarios
const chartOptions = {
  polarArea: {
    withTitle: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Polar Area Chart with Title',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        r: {
          ticks: {
            display: false,
          },
        },
      },
    } as ChartOptions<'polarArea'>,
    withLegendBottom: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
      },
      scales: {
        r: {
          ticks: {
            display: false,
          },
        },
      },
    } as ChartOptions<'polarArea'>,
  },
  radar: {
    withTitle: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Skills Comparison',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        r: {
          angleLines: {
            display: true,
          },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            display: false,
          },
        },
      },
    } as ChartOptions<'radar'>,
    customScale: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        r: {
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          pointLabels: {
            color: 'rgba(0, 0, 0, 0.7)',
            font: {
              size: 12,
            },
          },
          suggestedMin: 0,
          suggestedMax: 5,
          ticks: {
            stepSize: 1,
            display: false,
          },
        },
      },
    } as ChartOptions<'radar'>,
  },
  scatter: {
    withTitle: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Revenue vs Marketing Spend Correlation',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          title: {
            display: true,
            text: 'Marketing Spend ($k)',
          },
        },
        y: {
          type: 'linear' as const,
          title: {
            display: true,
            text: 'Revenue ($k)',
          },
        },
      },
    } as ChartOptions<'scatter'>,
    performance: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'System Performance Metrics',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          title: {
            display: true,
            text: 'Concurrent Users',
          },
        },
        y: {
          type: 'linear' as const,
          title: {
            display: true,
            text: 'Response Time (ms)',
          },
        },
      },
    } as ChartOptions<'scatter'>,
  },
}

const meta = {
  title: 'UI Components/Chart',
  component: PolarAreaChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Chart components built on Chart.js for displaying data visualizations including polar area, radar, and scatter charts.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Chart.js data configuration',
    },
    options: {
      control: { type: 'object' },
      description: 'Chart.js options configuration',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    width: {
      control: { type: 'number' },
      description: 'Chart width',
    },
    height: {
      control: { type: 'number' },
      description: 'Chart height',
    },
  },
} satisfies Meta<typeof PolarAreaChart>

export default meta
type Story = StoryObj<typeof meta>

// Polar Area Chart Stories
export const PolarAreaBasic: Story = {
  render: (args) => ({
    components: { PolarAreaChart },
    setup() {
      const chartData = mockChartData.polarArea.basic
      return { args, chartData }
    },
    template: `
      <div class="w-full max-w-md">
        <PolarAreaChart v-bind="args" :data="chartData" />
      </div>
    `,
  }),
}

export const PolarAreaSales: Story = {
  render: (args) => ({
    components: { PolarAreaChart },
    setup() {
      const chartData = mockChartData.polarArea.sales
      const options = chartOptions.polarArea.withTitle
      return { args, chartData, options }
    },
    template: `
      <div class="w-full max-w-md">
        <PolarAreaChart v-bind="args" :data="chartData" :options="options" />
      </div>
    `,
  }),
}

// Radar Chart Stories
export const RadarSkills: Story = {
  render: (args) => ({
    components: { RadarChart },
    setup() {
      const chartData = mockChartData.radar.skills
      const options = chartOptions.radar.withTitle
      return { args, chartData, options }
    },
    template: `
      <div class="w-full max-w-lg">
        <RadarChart v-bind="args" :data="chartData" :options="options" />
      </div>
    `,
  }),
}

export const RadarPerformance: Story = {
  render: (args) => ({
    components: { RadarChart },
    setup() {
      const chartData = mockChartData.radar.performance
      const options = {
        ...chartOptions.radar.withTitle,
        plugins: {
          ...chartOptions.radar.withTitle.plugins,
          title: {
            display: true,
            text: 'System Performance vs Goals',
            font: {
              size: 16,
              weight: 'bold' as const,
            },
          },
        },
      }
      return { args, chartData, options }
    },
    template: `
      <div class="w-full max-w-md">
        <RadarChart v-bind="args" :data="chartData" :options="options" height="400" />
      </div>
    `,
  }),
}

// Scatter Chart Stories
export const ScatterBasic: Story = {
  render: (args) => ({
    components: { ScatterChart },
    setup() {
      const chartData = mockChartData.scatter.basic
      return { args, chartData }
    },
    template: `
      <div class="w-full max-w-lg">
        <ScatterChart v-bind="args" :data="chartData" />
      </div>
    `,
  }),
}

export const ScatterCorrelation: Story = {
  render: (args) => ({
    components: { ScatterChart },
    setup() {
      const chartData = mockChartData.scatter.correlation
      const options = chartOptions.scatter.withTitle
      return { args, chartData, options }
    },
    template: `
      <div class="w-full max-w-lg">
        <ScatterChart v-bind="args" :data="chartData" :options="options" height="400" />
      </div>
    `,
  }),
}

// All Charts in Cards
export const AllChartsInCards: Story = {
  render: (args) => ({
    components: { PolarAreaChart, RadarChart, ScatterChart },
    setup() {
      return {
        args,
        polarData: mockChartData.polarArea.sales,
        radarData: mockChartData.radar.skills,
        scatterData: mockChartData.scatter.correlation,
        polarOptions: chartOptions.polarArea.withTitle,
        radarOptions: chartOptions.radar.withTitle,
        scatterOptions: chartOptions.scatter.withTitle,
      }
    },
    template: `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div class="rounded-lg border bg-card p-6 shadow-sm">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">Polar Area Chart</h3>
            <p class="text-sm text-muted-foreground">Sales data visualization</p>
            <PolarAreaChart :data="polarData" :options="polarOptions" height="300" />
          </div>
        </div>
        <div class="rounded-lg border bg-card p-6 shadow-sm">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">Radar Chart</h3>
            <p class="text-sm text-muted-foreground">Skills comparison analysis</p>
            <RadarChart :data="radarData" :options="radarOptions" height="300" />
          </div>
        </div>
        <div class="rounded-lg border bg-card p-6 shadow-sm">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">Scatter Chart</h3>
            <p class="text-sm text-muted-foreground">Revenue correlation data</p>
            <ScatterChart :data="scatterData" :options="scatterOptions" height="300" />
          </div>
        </div>
      </div>
    `,
  }),
}
