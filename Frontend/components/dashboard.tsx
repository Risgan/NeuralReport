'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  FileText, TrendingUp, Store, Receipt, DollarSign,
  Download, RotateCcw, Clock, ChevronRight,
} from 'lucide-react'
import { HistoryEntry, formatCurrency, TaxConfig } from '@/lib/types'
import { exportConsolidated } from '@/lib/excel'
import { cn } from '@/lib/utils'
import { catalogsService } from '@/services'

interface DashboardProps {
  history: HistoryEntry[]
  onRestore: (entry: HistoryEntry) => void
  onNewReport: () => void
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  accent: 'primary' | 'success' | 'highlight' | 'chart-4'
}) {
  const map = {
    primary:  { icon: 'bg-primary/10 text-primary',   val: 'text-primary' },
    success:  { icon: 'bg-success/10 text-success',   val: 'text-success' },
    highlight:{ icon: 'bg-highlight/10 text-highlight', val: 'text-highlight' },
    'chart-4':{ icon: 'bg-chart-4/10 text-chart-4',   val: 'text-chart-4' },
  }
  const c = map[accent]
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.icon)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-lg font-bold font-mono mt-0.5 tabular-nums', c.val)}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          <span className="font-semibold text-primary">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function Dashboard({ history, onRestore, onNewReport }: DashboardProps) {
  // KPI aggregates across all history entries
  const kpis = useMemo(() => {
    const totalReports = history.length
    const totalStores  = history.reduce((s, e) => s + e.storeCount, 0)
    const totalGross   = history.reduce((s, e) => s + e.grossTotal, 0)
    const totalNet     = history.reduce((s, e) => s + e.netTotal,   0)
    const totalTax     = history.reduce((s, e) => {
      const iva  = e.reportRows.reduce((ss, r) => ss + r.iva, 0)
      const rete = e.reportRows.reduce((ss, r) => ss + r.reteFuente + r.reteICA, 0)
      return s + iva + rete
    }, 0)
    return { totalReports, totalStores, totalGross, totalNet, totalTax }
  }, [history])

  // Bar chart: one bar per history entry (gross + net)
  const chartData = useMemo(() =>
    [...history].reverse().slice(0, 8).map((e) => ({
      name: e.label,
      Bruto: Math.round(e.grossTotal),
      Neto:  Math.round(e.netTotal),
    })),
  [history])

  // Recent reports table (last 5)
  const recent = useMemo(() => [...history].reverse().slice(0, 5), [history])

  const empty = history.length === 0

  const handleCreateReportClick = async () => {
    try {
      const years = await catalogsService.getYears()
      console.log('Catalog years:', years)
      const months = await catalogsService.getMonths()
      console.log('Catalog months:', months)
      // onNewReport()
    } catch (error) {
      console.error('Error fetching years:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vision general de todos los informes finalizados
          </p>
        </div>
        <button
          onClick={onNewReport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground
            font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
        >
          <FileText className="w-4 h-4" />
          Nuevo informe
        </button>
      </div>

      {empty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border bg-card">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Sin informes aun</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Genera y finaliza tu primer informe trimestral para ver las estadisticas aqui.
            </p>
          </div>
          <button
            onClick={handleCreateReportClick}
            // onClick={onNewReport}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground
              font-semibold text-sm hover:brightness-110 transition-all"
          >
            <FileText className="w-4 h-4" />
            Crear informe
          </button>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={FileText}   label="Informes totales" value={kpis.totalReports.toString()} accent="primary"   sub="Finalizados" />
            <KpiCard icon={TrendingUp} label="Valor bruto total" value={formatCurrency(kpis.totalGross)} accent="success"   sub="Suma de todos los periodos" />
            <KpiCard icon={Receipt}    label="Total impuestos"   value={formatCurrency(kpis.totalTax)}   accent="highlight" sub="IVA + ReteFuente + ReteICA" />
            <KpiCard icon={DollarSign} label="Total neto"        value={formatCurrency(kpis.totalNet)}   accent="primary"   sub="Despues de retenciones" />
          </div>

          {/* Bar chart */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Valor bruto vs neto por periodo</p>
                <p className="text-xs text-muted-foreground">Ultimos {chartData.length} informes</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" />
                  Bruto
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
                  Neto
                </span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={3} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : `${v}`
                    }
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-border)', opacity: 0.4 }} />
                  <Bar dataKey="Bruto" radius={[4, 4, 0, 0]} fill="var(--color-success)" opacity={0.85} />
                  <Bar dataKey="Neto"  radius={[4, 4, 0, 0]} fill="var(--color-primary)" opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent reports table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Informes recientes</p>
              <p className="text-xs text-muted-foreground">{recent.length} de {history.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    {['Periodo', 'Tiendas', 'Valor bruto', 'Impuestos', 'Neto', 'Fecha', ''].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          'px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap',
                          h === 'Periodo' ? 'text-left' : h === '' ? '' : 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((entry, idx) => {
                    const date = new Date(entry.createdAt)
                    const dateLabel = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    const taxes = entry.reportRows.reduce(
                      (s, r) => s + r.iva + r.reteFuente + r.reteICA, 0,
                    )
                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          'border-b border-border/40 hover:bg-muted/40 transition-colors',
                          idx % 2 !== 0 ? 'bg-secondary/30' : '',
                        )}
                      >
                        <td className="px-5 py-3 font-semibold text-foreground whitespace-nowrap">{entry.label}</td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">{entry.storeCount}</td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-success font-semibold">{formatCurrency(entry.grossTotal)}</td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-highlight">{formatCurrency(taxes)}</td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-primary font-bold">{formatCurrency(entry.netTotal)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {dateLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => exportConsolidated(entry.months, entry.reportRows, entry.taxConfig, `NeuralReport_${entry.period}.xlsx`)}
                              title="Descargar Excel"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                                hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRestore(entry)}
                              title="Ver informe"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                                hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stores leaderboard across all reports */}
          <StoreLeaderboard history={history} />
        </>
      )}
    </div>
  )
}

function StoreLeaderboard({ history }: { history: HistoryEntry[] }) {
  const stores = useMemo(() => {
    const map = new Map<string, { gross: number; net: number; periods: number }>()
    history.forEach((e) => {
      e.reportRows.forEach((r) => {
        const key = r.tienda.trim().toLowerCase()
        const existing = map.get(key) ?? { gross: 0, net: 0, periods: 0 }
        map.set(key, {
          gross: existing.gross + r.valorTotal,
          net: existing.net + r.totalNeto,
          periods: existing.periods + 1,
        })
      })
    })
    return [...map.entries()]
      .map(([key, v]) => ({
        name: history.flatMap((e) => e.reportRows).find((r) => r.tienda.trim().toLowerCase() === key)?.tienda ?? key,
        ...v,
      }))
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 10)
  }, [history])

  if (stores.length === 0) return null

  const max = stores[0].gross

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold text-foreground">Top tiendas por valor bruto</p>
        <p className="text-xs text-muted-foreground">Acumulado en todos los periodos</p>
      </div>
      <div className="flex flex-col gap-2">
        {stores.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-muted-foreground w-4 text-right shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-foreground font-medium w-36 shrink-0 truncate">{s.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(s.gross / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground w-28 text-right shrink-0">
              {formatCurrency(s.gross)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
