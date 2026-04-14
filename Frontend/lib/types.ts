// ─── Step flow ────────────────────────────────────────────────────────────────
export type AppStep = 'period' | 'upload' | 'review' | 'report'

// ─── Tax / calculation config ─────────────────────────────────────────────────
export interface TaxConfig {
  /** IVA rate, e.g. 19 = 19% */
  iva: number
  /** ReteFuente rate, e.g. 3.5 = 3.5% */
  reteFuente: number
  /** ReteICA rate, e.g. 0.414 = 0.414% */
  reteICA: number
  /**
   * Precio del importe (unit price for the report).
   * Multiplied by diasActivos per row if importeMode === 'unit',
   * or used as a flat fee per row if importeMode === 'flat'.
   */
  precioImporte: number
  /**
   * How importe is calculated.
   * 'unit'  → importe = precioImporte * diasActivos
   * 'flat'  → importe = precioImporte (same for every row, informative)
   * 'none'  → importe column hidden
   */
  importeMode: 'unit' | 'flat' | 'none'
  /**
   * How IVA is applied.
   * 'add'  → totalNeto = valorTotal + iva - reteFuente - reteICA
   * 'none' → IVA column shown but excluded from totalNeto
   */
  ivaMode: 'add' | 'none'
  /**
   * How reteFuente & reteICA are deducted.
   * 'deduct' → subtract from valorTotal
   * 'none'   → shown but not deducted
   */
  retentionMode: 'deduct' | 'none'
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  iva: 19,
  reteFuente: 3.5,
  reteICA: 0.414,
  precioImporte: 0,
  importeMode: 'unit',
  ivaMode: 'add',
  retentionMode: 'deduct',
}

// ─── Row inside a monthly file ────────────────────────────────────────────────
export interface StoreRow {
  id: string
  tienda: string
  diasActivos: number
  valorTotal: number
  /** true when user manually edited any cell */
  modified: boolean
  /** true when this row was added by the user (not from the file) */
  isNew?: boolean
}

// ─── One month's loaded data ──────────────────────────────────────────────────
export interface MonthData {
  name: string
  shortName: string
  year: number
  index: number
  file: File | null
  rows: StoreRow[]
  loaded: boolean
}

// ─── Consolidated report row ──────────────────────────────────────────────────
export interface ReportRow {
  tienda: string
  diasActivos: number
  /** importe = precioImporte * diasActivos (or flat/none depending on mode) */
  importe: number
  /** value per month */
  mes1: number
  mes2: number
  mes3: number
  /** sum of three months */
  valorTotal: number
  /** IVA on valorTotal */
  iva: number
  /** ReteFuente on valorTotal */
  reteFuente: number
  /** ReteICA on valorTotal */
  reteICA: number
  /** final amount after applying ivaMode + retentionMode */
  totalNeto: number
}

// ─── History entry ────────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: string
  createdAt: string
  period: string
  /** e.g. "Ene – Mar 2025" */
  label: string
  months: MonthData[]
  reportRows: ReportRow[]
  taxConfig: TaxConfig
  grossTotal: number
  netTotal: number
  storeCount: number
}

// ─── Locale helpers ───────────────────────────────────────────────────────────
export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// ─── Quarter builder ──────────────────────────────────────────────────────────
export function getQuarterMonths(startMonthIndex: number, year: number): MonthData[] {
  return [0, 1, 2].map((offset) => {
    const idx = (startMonthIndex + offset) % 12
    const y = startMonthIndex + offset >= 12 ? year + 1 : year
    return {
      name: MONTHS_ES[idx],
      shortName: MONTHS_SHORT[idx],
      year: y,
      index: idx,
      file: null,
      rows: [],
      loaded: false,
    }
  })
}

// ─── Report computation ───────────────────────────────────────────────────────
export function computeReport(months: MonthData[], tax: TaxConfig): ReportRow[] {
  const storeMap = new Map<string, {
    diasActivos: number
    mes1: number
    mes2: number
    mes3: number
  }>()

  months.forEach((month, mIdx) => {
    month.rows.forEach((row) => {
      const key = row.tienda.trim().toLowerCase()
      if (!storeMap.has(key)) storeMap.set(key, { diasActivos: 0, mes1: 0, mes2: 0, mes3: 0 })
      const entry = storeMap.get(key)!
      // Accumulate diasActivos across all months
      entry.diasActivos += row.diasActivos
      if (mIdx === 0) entry.mes1 += row.valorTotal
      if (mIdx === 1) entry.mes2 += row.valorTotal
      if (mIdx === 2) entry.mes3 += row.valorTotal
    })
  })

  const rows: ReportRow[] = []
  storeMap.forEach((vals, key) => {
    const originalName =
      months.flatMap((m) => m.rows).find((r) => r.tienda.trim().toLowerCase() === key)?.tienda ?? key

    const valorTotal = vals.mes1 + vals.mes2 + vals.mes3
    const iva = valorTotal * (tax.iva / 100)
    const reteFuente = valorTotal * (tax.reteFuente / 100)
    const reteICA = valorTotal * (tax.reteICA / 100)

    let importe = 0
    if (tax.importeMode === 'unit') importe = tax.precioImporte * vals.diasActivos
    else if (tax.importeMode === 'flat') importe = tax.precioImporte

    let totalNeto = valorTotal
    if (tax.ivaMode === 'add') totalNeto += iva
    if (tax.retentionMode === 'deduct') totalNeto -= reteFuente + reteICA

    rows.push({
      tienda: originalName,
      diasActivos: vals.diasActivos,
      importe,
      mes1: vals.mes1,
      mes2: vals.mes2,
      mes3: vals.mes3,
      valorTotal,
      iva,
      reteFuente,
      reteICA,
      totalNeto,
    })
  })

  return rows.sort((a, b) => a.tienda.localeCompare(b.tienda))
}

// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPct(value: number): string {
  return `${value}%`
}

// ─── Available years for the selector ────────────────────────────────────────
const _currentYear = new Date().getFullYear()
export const AVAILABLE_YEARS: number[] = [
  _currentYear - 2,
  _currentYear - 1,
  _currentYear,
  _currentYear + 1,
]
