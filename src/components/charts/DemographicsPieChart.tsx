import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DemographicsData {
  numberOfMales: number
  numberOfFemales: number
  numberOfChildren: number
  totalAttendance: number
}

interface DemographicsPieChartProps {
  data: DemographicsData
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = {
  males: '#3B82F6',    // blue-500
  females: '#EC4899',  // pink-500
  children: '#F59E0B'  // amber-500
}

export default function DemographicsPieChart({ data, size = 'md' }: DemographicsPieChartProps) {
  const chartData = [
    {
      name: 'Males',
      value: data.numberOfMales,
      color: COLORS.males,
      percentage: ((data.numberOfMales / data.totalAttendance) * 100).toFixed(1)
    },
    {
      name: 'Females',
      value: data.numberOfFemales,
      color: COLORS.females,
      percentage: ((data.numberOfFemales / data.totalAttendance) * 100).toFixed(1)
    },
    {
      name: 'Children',
      value: data.numberOfChildren,
      color: COLORS.children,
      percentage: ((data.numberOfChildren / data.totalAttendance) * 100).toFixed(1)
    }
  ]

  const heights = {
    sm: 200,
    md: 250,
    lg: 300
  }

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const customLabel = ({ percentage }: any) => {
    return `${percentage}%`
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={heights[size]}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={customLabel}
            outerRadius={size === 'sm' ? 60 : size === 'md' ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: any) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}