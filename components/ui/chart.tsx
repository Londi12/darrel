"use client"

import * as React from "react"
import type { ChartTooltipProps, TooltipProps } from "recharts"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue>({
  config: {},
})

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ config, children, className }: ChartContainerProps) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={className}
        style={
          {
            "--color-revenue": config.revenue?.color,
            "--color-costs": config.costs?.color,
            "--color-profit": config.profit?.color,
            "--color-labour": config.labour?.color,
            "--color-materials": config.materials?.color,
            "--color-equipment": config.equipment?.color,
            "--color-overhead": config.overhead?.color,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

export function ChartTooltip({ active, payload, label, content, ...props }: TooltipProps<any, any>) {
  const { config } = React.useContext(ChartContext)

  if (!active || !payload?.length) {
    return null
  }

  if (content) {
    return React.cloneElement(content, { payload, label, ...props })
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        {payload.map((data: any) => {
          const name = data.name || data.dataKey
          const color = data.color || config[name]?.color
          const label = config[name]?.label || name
          const value = data.value

          return (
            <div key={name} className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="font-medium">{value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartTooltipContent({ payload, label }: ChartTooltipProps<any, any>) {
  const { config } = React.useContext(ChartContext)

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        {payload?.map((data: any) => {
          const name = data.name || data.dataKey
          const color = data.color || config[name]?.color
          const label = config[name]?.label || name
          const value = data.value

          return (
            <div key={name} className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="font-medium">${value.toLocaleString()}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
