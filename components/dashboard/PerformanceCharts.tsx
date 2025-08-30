'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { usePerformanceData } from '@/components/hooks/usePerformanceData'

interface PerformanceChartsProps {
  timeRange: string
}

export default function PerformanceCharts({
  timeRange,
}: PerformanceChartsProps) {
  const { data, isLoading, error } = usePerformanceData(timeRange)
  const [activeChart, setActiveChart] = useState<
    'cost' | 'conversions' | 'roas'
  >('cost')

  const chartConfig = {
    cost: {
      title: 'Daily Spend',
      color: '#3B82F6',
      dataKey: 'cost',
      formatValue: (value: string | number) =>
        `$${Number(value).toLocaleString()}`,
    },
    conversions: {
      title: 'Daily Conversions',
      color: '#10B981',
      dataKey: 'conversions',
      formatValue: (value: string | number) => Number(value).toString(),
    },
    roas: {
      title: 'ROAS Trend',
      color: '#F59E0B',
      dataKey: 'roas',
      formatValue: (value: string | number) => `${value}x`,
    },
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Performance Overview ▲
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm mb-2">
            Unable to load performance data
          </p>
          <p className="text-gray-500 text-xs">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-black mb-4 sm:mb-0">
          Performance Overview ▲
        </h3>

        <div className="flex flex-wrap gap-2 max-w-full">
          {Object.entries(chartConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveChart(key as keyof typeof chartConfig)}
              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                activeChart === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {config.title}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading performance data...</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              No performance data available
            </p>
            <p className="text-gray-500 text-xs">
              Connect Google Ads to see performance charts
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-64 w-full max-w-full overflow-hidden"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig[activeChart].color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[activeChart].color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value: number) =>
                  chartConfig[activeChart].formatValue(value)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: string | number) => [
                  chartConfig[activeChart].formatValue(value),
                  chartConfig[activeChart].title,
                ]}
              />
              <Area
                type="monotone"
                dataKey={chartConfig[activeChart].dataKey}
                stroke={chartConfig[activeChart].color}
                strokeWidth={2}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Quick Stats */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {Object.entries(chartConfig).map(([key, config]) => {
            const total = data.reduce((sum, item) => {
              const value = item[config.dataKey as keyof typeof item]
              return (
                sum +
                (typeof value === 'string' ? parseFloat(value) : Number(value))
              )
            }, 0)
            const average = (total / data.length).toFixed(
              key === 'roas' ? 1 : 0,
            )

            return (
              <div
                key={key}
                className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-xs text-gray-500 mb-1">Avg {config.title}</p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: config.color }}
                >
                  {config.formatValue(average)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
