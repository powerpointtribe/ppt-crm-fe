interface CSSPieChartProps {
  data: {
    numberOfMales: number
    numberOfFemales: number
    numberOfChildren: number
    totalAttendance: number
  }
  size?: number
}

export default function CSSPieChart({ data, size = 200 }: CSSPieChartProps) {
  const { numberOfMales, numberOfFemales, numberOfChildren, totalAttendance } = data

  // Calculate percentages
  const malePercent = (numberOfMales / totalAttendance) * 100
  const femalePercent = (numberOfFemales / totalAttendance) * 100
  const childrenPercent = (numberOfChildren / totalAttendance) * 100

  // Calculate cumulative percentages for CSS conic-gradient
  const maleEnd = malePercent
  const femaleEnd = maleEnd + femalePercent
  const childrenEnd = femaleEnd + childrenPercent

  const pieStyle = {
    width: size,
    height: size,
    background: `conic-gradient(
      #3B82F6 0% ${maleEnd}%,
      #EC4899 ${maleEnd}% ${femaleEnd}%,
      #F59E0B ${femaleEnd}% ${childrenEnd}%
    )`,
    borderRadius: '50%',
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div style={pieStyle} className="shadow-lg"></div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Males ({malePercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span>Females ({femalePercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Children ({childrenPercent.toFixed(1)}%)</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between border-b pb-1">
          <span className="text-gray-600">Males</span>
          <span className="font-medium">{numberOfMales}</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="text-gray-600">Females</span>
          <span className="font-medium">{numberOfFemales}</span>
        </div>
        <div className="flex justify-between border-b pb-1">
          <span className="text-gray-600">Children</span>
          <span className="font-medium">{numberOfChildren}</span>
        </div>
        <div className="flex justify-between font-semibold pt-1">
          <span>Total</span>
          <span>{totalAttendance}</span>
        </div>
      </div>
    </div>
  )
}

// Export a pure HTML/CSS version for PDF generation
export function generatePieChartHTML(data: {
  numberOfMales: number
  numberOfFemales: number
  numberOfChildren: number
  totalAttendance: number
}, size = 200) {
  const { numberOfMales, numberOfFemales, numberOfChildren, totalAttendance } = data

  // Calculate percentages
  const malePercent = (numberOfMales / totalAttendance) * 100
  const femalePercent = (numberOfFemales / totalAttendance) * 100
  const childrenPercent = (numberOfChildren / totalAttendance) * 100

  // Calculate cumulative percentages for CSS conic-gradient
  const maleEnd = malePercent
  const femaleEnd = maleEnd + femalePercent
  const childrenEnd = femaleEnd + childrenPercent

  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; margin: 20px 0;">
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: conic-gradient(
          #3B82F6 0% ${maleEnd}%,
          #EC4899 ${maleEnd}% ${femaleEnd}%,
          #F59E0B ${femaleEnd}% ${childrenEnd}%
        );
        border-radius: 50%;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      "></div>

      <!-- Legend -->
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; font-size: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #3B82F6;"></div>
          <span>Males (${malePercent.toFixed(1)}%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #EC4899;"></div>
          <span>Females (${femalePercent.toFixed(1)}%)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #F59E0B;"></div>
          <span>Children (${childrenPercent.toFixed(1)}%)</span>
        </div>
      </div>

      <!-- Data Table -->
      <div style="width: 100%; max-width: 300px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">
          <span style="color: #6b7280;">Males</span>
          <span style="font-weight: 500;">${numberOfMales}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 4px;">
          <span style="color: #6b7280;">Females</span>
          <span style="font-weight: 500;">${numberOfFemales}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 4px;">
          <span style="color: #6b7280;">Children</span>
          <span style="font-weight: 500;">${numberOfChildren}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 600; padding-top: 4px; margin-top: 4px;">
          <span>Total</span>
          <span>${totalAttendance}</span>
        </div>
      </div>
    </div>
  `
}