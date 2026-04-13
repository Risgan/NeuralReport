import * as XLSX from 'xlsx'
import type { StoreRow, MonthData, ReportRow, TaxConfig } from './types'

// ─── Parse ────────────────────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<StoreRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: '',
        }) as unknown[][]

        if (jsonData.length < 2) { resolve([]); return }

        // Detect header row (first row containing "tienda" case-insensitive)
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          if (
            (jsonData[i] as unknown[]).some(
              (c) => typeof c === 'string' && c.toLowerCase().includes('tienda'),
            )
          ) { headerRowIdx = i; break }
        }

        const headers = (jsonData[headerRowIdx] as unknown[]).map((h) =>
          String(h).toLowerCase().trim(),
        )

        const tiendaIdx = headers.findIndex(
          (h) => h.includes('tienda') || h.includes('store') || h.includes('nombre'),
        )
        const diasIdx = headers.findIndex(
          (h) => h.includes('dia') || h.includes('day') || h.includes('activo'),
        )
        const valorIdx = headers.findIndex(
          (h) =>
            h.includes('valor') || h.includes('total') || h.includes('monto') || h.includes('importe'),
        )

        const rows: StoreRow[] = []
        for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as unknown[]
          const tienda = tiendaIdx >= 0 ? String(row[tiendaIdx] ?? '').trim() : ''
          if (!tienda) continue

          const diasRaw = diasIdx >= 0 ? row[diasIdx] : 0
          const valorRaw = valorIdx >= 0 ? row[valorIdx] : 0

          const diasActivos =
            typeof diasRaw === 'number' ? diasRaw : parseFloat(String(diasRaw).replace(/[^\d.-]/g, '')) || 0
          const valorTotal =
            typeof valorRaw === 'number' ? valorRaw : parseFloat(String(valorRaw).replace(/[^\d.-]/g, '')) || 0

          rows.push({ id: `${i}-${tienda}`, tienda, diasActivos, valorTotal, modified: false })
        }

        resolve(rows)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number) { return `${v}%` }

// ─── Export consolidated ──────────────────────────────────────────────────────

export function exportConsolidated(
  months: MonthData[],
  reportRows: ReportRow[],
  tax: TaxConfig,
  filename = 'NeuralReport_Informe.xlsx',
) {
  const wb = XLSX.utils.book_new()

  /* ── Sheet 1: Consolidated report ── */
  const m1 = months[0]?.shortName ?? 'Mes 1'
  const m2 = months[1]?.shortName ?? 'Mes 2'
  const m3 = months[2]?.shortName ?? 'Mes 3'

  const showImporte = tax.importeMode !== 'none'

  const headers = [
    'Tienda',
    'Dias Activos',
    ...(showImporte ? [`Importe ($ ${tax.precioImporte})`] : []),
    m1, m2, m3,
    'Valor Total',
    `IVA (${pct(tax.iva)})`,
    `ReteFuente (${pct(tax.reteFuente)})`,
    `ReteICA (${pct(tax.reteICA)})`,
    'Total Neto',
  ]

  const body = reportRows.map((r) => [
    r.tienda,
    r.diasActivos,
    ...(showImporte ? [r.importe] : []),
    r.mes1, r.mes2, r.mes3,
    r.valorTotal, r.iva, r.reteFuente, r.reteICA, r.totalNeto,
  ])

  const sumNum = (key: keyof ReportRow) =>
    reportRows.reduce((s, r) => s + (r[key] as number), 0)

  const totals = [
    'TOTAL',
    sumNum('diasActivos'),
    ...(showImporte ? [sumNum('importe')] : []),
    sumNum('mes1'), sumNum('mes2'), sumNum('mes3'),
    sumNum('valorTotal'), sumNum('iva'), sumNum('reteFuente'), sumNum('reteICA'), sumNum('totalNeto'),
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...body, totals])

  const colWidths: XLSX.ColInfo[] = [
    { wch: 28 }, { wch: 13 },
    ...(showImporte ? [{ wch: 18 }] : []),
    { wch: 13 }, { wch: 13 }, { wch: 13 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Informe Consolidado')

  /* ── Sheet 2: Per-month detail ── */
  months.forEach((month) => {
    const mHeaders = ['Tienda', 'Dias Activos', 'Valor Total', 'IVA', 'ReteFuente', 'ReteICA', 'Total Neto']
    const mBody = month.rows.map((r) => {
      const iva = r.valorTotal * (tax.iva / 100)
      const rF  = r.valorTotal * (tax.reteFuente / 100)
      const rI  = r.valorTotal * (tax.reteICA / 100)
      let neto = r.valorTotal
      if (tax.ivaMode === 'add') neto += iva
      if (tax.retentionMode === 'deduct') neto -= rF + rI
      return [r.tienda, r.diasActivos, r.valorTotal, iva, rF, rI, neto]
    })
    const mTotal = mBody.reduce<number[]>((acc, row) => {
      row.slice(1).forEach((v, i) => { acc[i] = (acc[i] ?? 0) + (v as number) })
      return acc
    }, [])

    const wsMes = XLSX.utils.aoa_to_sheet([mHeaders, ...mBody, ['TOTAL', ...mTotal]])
    wsMes['!cols'] = [{ wch: 28 }, { wch: 13 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, wsMes, `${month.shortName} ${month.year}`)
  })

  /* ── Sheet 3: Tax config reference ── */
  const cfgWs = XLSX.utils.aoa_to_sheet([
    ['Parametro', 'Valor'],
    ['IVA', pct(tax.iva)],
    ['ReteFuente', pct(tax.reteFuente)],
    ['ReteICA', pct(tax.reteICA)],
    ['Precio Importe', `$ ${tax.precioImporte}`],
    ['Modo Importe', tax.importeMode === 'unit' ? 'Por dias activos' : tax.importeMode === 'flat' ? 'Valor fijo' : 'No aplicar'],
    ['Modo IVA', tax.ivaMode === 'add' ? 'Suma al total' : 'Solo informativo'],
    ['Modo Retenciones', tax.retentionMode === 'deduct' ? 'Descuenta del total' : 'Solo informativo'],
  ])
  cfgWs['!cols'] = [{ wch: 22 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, cfgWs, 'Configuracion')

  XLSX.writeFile(wb, filename)
}
