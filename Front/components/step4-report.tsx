'use client'

import { useState, useMemo } from 'react'
import {
  ArrowUpDown, ArrowUp, ArrowDown, Download,
  ChevronLeft, Store, TrendingUp, Receipt, DollarSign, AlertTriangle,
  CheckCircle2, Lock, FileCheck,
} from 'lucide-react'
import { MonthData, ReportRow, TaxConfig, formatCurrency, formatPct } from '@/lib/types'
import { exportConsolidated } from '@/lib/excel'
import { cn } from '@/lib/utils'

interface Step4ReportProps {
  months: MonthData[]
  reportRows: ReportRow[]
  taxConfig: TaxConfig
  onBack: () => void
  onFinalize: () => void
}

type SortKey = keyof ReportRow
type SortDir = 'asc' | 'desc'

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
  bgClass,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  colorClass: string
  bgClass: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 flex flex-col gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bgClass)}>
        <Icon className={cn('w-4 h-4', colorClass)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-bold font-mono mt-0.5', colorClass)}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function TotalsCheck({ months, reportRows }: { months: MonthData[]; reportRows: ReportRow[] }) {
  const fileTotals = months.map((m) => m.rows.reduce((s, r) => s + r.valorTotal, 0))
  const reportMonthTotals = [
    reportRows.reduce((s, r) => s + r.mes1, 0),
    reportRows.reduce((s, r) => s + r.mes2, 0),
    reportRows.reduce((s, r) => s + r.mes3, 0),
  ]
  const allMatch = fileTotals.every((ft, i) => Math.abs(ft - reportMonthTotals[i]) < 0.01)

  return (
    <div className={cn(
      'rounded-xl border px-4 py-3 flex flex-col gap-3',
      allMatch ? 'border-success/30 bg-success/5' : 'border-highlight/30 bg-highlight/5',
    )}>
      <div className="flex items-center gap-2">
        {allMatch
          ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-highlight shrink-0" />}
        <p className={cn('text-xs font-semibold', allMatch ? 'text-success' : 'text-highlight')}>
          {allMatch ? 'Los totales coinciden con los archivos' : 'Diferencia detectada con los archivos'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {months.map((m, idx) => {
          const diff = Math.abs(fileTotals[idx] - reportMonthTotals[idx])
          const match = diff < 0.01
          return (
            <div key={idx} className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{m.shortName} {m.year}</p>
              <p className="text-xs font-mono font-semibold text-foreground mt-0.5">
                {formatCurrency(reportMonthTotals[idx])}
              </p>
              <div className="mt-1">
                {match
                  ? <span className="text-[10px] text-success">Cuadra</span>
                  : <span className="text-[10px] text-highlight">Dif: {formatCurrency(diff)}</span>}
              </div>
            </div>
          )
        })}
      </div>
      {!allMatch && (
        <p className="text-xs text-muted-foreground">
          Regresa al paso anterior para revisar y corregir los datos antes de exportar.
        </p>
      )}
    </div>
  )
}

export function Step4Report({ months, reportRows, taxConfig, onBack, onFinalize }: Step4ReportProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tienda')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [finalized, setFinalized] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const showImporte = taxConfig.importeMode !== 'none'

  const sorted = useMemo(() => {
    return [...reportRows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [reportRows, sortKey, sortDir])

  const sumNum = (key: keyof ReportRow) => reportRows.reduce((s, r) => s + (r[key] as number), 0)

  const grossTotal  = sumNum('valorTotal')
  const totalIva    = sumNum('iva')
  const totalReteFuente = sumNum('reteFuente')
  const totalReteICA    = sumNum('reteICA')
  const totalImporte    = sumNum('importe')
  const netTotal    = sumNum('totalNeto')

  type ColDef = { key: SortKey; label: string; align: 'left' | 'right'; accent?: string; hide?: boolean }
  const columns: ColDef[] = [
    { key: 'tienda',       label: 'Tienda',                            align: 'left' },
    { key: 'diasActivos',  label: 'Dias Activos',                      align: 'right' },
    { key: 'importe',      label: `Importe ($${taxConfig.precioImporte})`, align: 'right', accent: 'text-chart-3', hide: !showImporte },
    { key: 'mes1',         label: months[0]?.shortName ?? 'Mes 1',     align: 'right' },
    { key: 'mes2',         label: months[1]?.shortName ?? 'Mes 2',     align: 'right' },
    { key: 'mes3',         label: months[2]?.shortName ?? 'Mes 3',     align: 'right' },
    { key: 'valorTotal',   label: 'Valor Total',                       align: 'right' },
    { key: 'iva',          label: `IVA ${formatPct(taxConfig.iva)}`,   align: 'right', accent: 'text-chart-2' },
    { key: 'reteFuente',   label: `ReteFuente ${formatPct(taxConfig.reteFuente)}`, align: 'right', accent: 'text-chart-2' },
    { key: 'reteICA',      label: `ReteICA ${formatPct(taxConfig.reteICA)}`,       align: 'right', accent: 'text-chart-2' },
    { key: 'totalNeto',    label: 'Total Neto',                        align: 'right', accent: 'text-primary' },
  ].filter((c) => !c.hide) as ColDef[]

  const handleFinalize = () => {
    setFinalized(true)
    onFinalize()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Informe Consolidado</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {months[0]?.name} – {months[2]?.name} {months[0]?.year} &bull; {reportRows.length} tiendas
          </p>
        </div>

        {/* Finalize + Download */}
        <div className="flex items-center gap-2">
          {!finalized ? (
            <button
              onClick={handleFinalize}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success text-success-foreground
                font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-success/20 active:scale-[0.98]"
            >
              <FileCheck className="w-4 h-4" />
              Finalizar informe
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Informe finalizado
              </div>
              <button
                onClick={() => exportConsolidated(months, reportRows, taxConfig)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground
                  font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Descargar Excel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Finalizar prompt banner */}
      {!finalized && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Revisa el informe y cuando este listo haz clic en{' '}
            <strong className="text-foreground">Finalizar informe</strong> para habilitar la descarga.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Store}      label="Tiendas"        value={reportRows.length.toString()} colorClass="text-primary"   bgClass="bg-primary/10" />
        <SummaryCard icon={TrendingUp} label="Valor Bruto"    value={formatCurrency(grossTotal)}   colorClass="text-success"   bgClass="bg-success/10" />
        <SummaryCard
          icon={Receipt}
          label="Total Impuestos"
          value={formatCurrency(totalIva + totalReteFuente + totalReteICA)}
          sub="IVA + ReteFuente + ReteICA"
          colorClass="text-highlight"
          bgClass="bg-highlight/10"
        />
        <SummaryCard icon={DollarSign} label="Total Neto"     value={formatCurrency(netTotal)}     colorClass="text-primary"   bgClass="bg-primary/10" />
      </div>

      {/* Totals comparison */}
      <TotalsCheck months={months} reportRows={reportRows} />

      {/* Tax + importe breakdown row */}
      <div className={cn('grid gap-3', showImporte ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3')}>
        {[
          { label: `IVA (${formatPct(taxConfig.iva)})`,               value: totalIva,          mode: taxConfig.ivaMode === 'add' ? 'Suma al neto' : 'Informativo' },
          { label: `ReteFuente (${formatPct(taxConfig.reteFuente)})`,  value: totalReteFuente,   mode: taxConfig.retentionMode === 'deduct' ? 'Descuenta del neto' : 'Informativo' },
          { label: `ReteICA (${formatPct(taxConfig.reteICA)})`,        value: totalReteICA,      mode: taxConfig.retentionMode === 'deduct' ? 'Descuenta del neto' : 'Informativo' },
          ...(showImporte ? [{
            label: `Importe ($${taxConfig.precioImporte} × dias)`,
            value: totalImporte,
            mode: taxConfig.importeMode === 'unit' ? 'Por dias activos' : 'Valor fijo por tienda',
          }] : []),
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-bold font-mono text-highlight mt-0.5">{formatCurrency(item.value)}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{item.mode}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                {columns.map(({ key, label, align, accent }) => {
                  const isSorted = sortKey === key
                  const Icon = isSorted ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                  return (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={cn(
                        'px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer',
                        'hover:text-foreground transition-colors select-none whitespace-nowrap',
                        align === 'right' ? 'text-right' : 'text-left',
                        accent && isSorted ? accent : '',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {align === 'right' && (
                          <Icon className={cn('w-3 h-3', isSorted ? 'text-primary' : 'text-muted-foreground/30')} />
                        )}
                        {label}
                        {align === 'left' && (
                          <Icon className={cn('w-3 h-3', isSorted ? 'text-primary' : 'text-muted-foreground/30')} />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr
                  key={row.tienda}
                  className={cn(
                    'border-b border-border/40 transition-colors hover:bg-surface-raised',
                    idx % 2 !== 0 ? 'bg-surface/40' : '',
                  )}
                >
                  <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{row.tienda}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{row.diasActivos}</td>
                  {showImporte && <td className="px-4 py-2.5 text-right font-mono text-xs text-chart-3 font-semibold">{formatCurrency(row.importe)}</td>}
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCurrency(row.mes1)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCurrency(row.mes2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCurrency(row.mes3)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-foreground">{formatCurrency(row.valorTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-chart-2">{formatCurrency(row.iva)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-chart-2">{formatCurrency(row.reteFuente)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-chart-2">{formatCurrency(row.reteICA)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-primary">{formatCurrency(row.totalNeto)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-surface-raised">
                <td className="px-4 py-3 text-xs font-bold text-foreground">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-foreground">{sumNum('diasActivos')}</td>
                {showImporte && <td className="px-4 py-3 text-right font-mono text-xs font-bold text-chart-3">{formatCurrency(totalImporte)}</td>}
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-foreground">{formatCurrency(sumNum('mes1'))}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-foreground">{formatCurrency(sumNum('mes2'))}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-foreground">{formatCurrency(sumNum('mes3'))}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-foreground">{formatCurrency(grossTotal)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-chart-2">{formatCurrency(totalIva)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-chart-2">{formatCurrency(totalReteFuente)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-chart-2">{formatCurrency(totalReteICA)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs font-bold text-primary">{formatCurrency(netTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card
            text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Corregir datos
        </button>
        {finalized && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Download className="w-3 h-3" />
            El archivo .xlsx incluye informe, detalle por mes y configuracion.
          </p>
        )}
      </div>
    </div>
  )
}
