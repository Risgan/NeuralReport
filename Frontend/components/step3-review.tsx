'use client'

import { useState, useRef } from 'react'
import {
  Pencil, Trash2, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, RefreshCw,
} from 'lucide-react'
import { MonthData, StoreRow, formatCurrency } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Step3ReviewProps {
  months: MonthData[]
  onMonthsUpdate: (months: MonthData[]) => void
  onRecalculate: () => void
  onNext: () => void
  onBack: () => void
}

type EditingCell = { rowId: string; col: 'tienda' | 'diasActivos' | 'valorTotal' } | null

function MonthTable({
  month,
  onRowsChange,
}: {
  month: MonthData
  onRowsChange: (rows: StoreRow[]) => void
}) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = (row: StoreRow, col: 'tienda' | 'diasActivos' | 'valorTotal') => {
    setEditingCell({ rowId: row.id, col })
    setEditValue(String(row[col]))
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  const commitEdit = () => {
    if (!editingCell) return
    const { rowId, col } = editingCell
    const updated = month.rows.map((row) => {
      if (row.id !== rowId) return row
      let newVal: string | number = editValue
      if (col === 'diasActivos') newVal = parseInt(editValue) || 0
      else if (col === 'valorTotal') newVal = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0
      const changed = row[col] !== newVal
      return { ...row, [col]: newVal, modified: changed ? true : row.modified }
    })
    onRowsChange(updated)
    setEditingCell(null)
  }

  const deleteRow = (rowId: string) => {
    onRowsChange(month.rows.filter((r) => r.id !== rowId))
  }

  const addRow = () => {
    const newRow: StoreRow = {
      id: `new-${Date.now()}`,
      tienda: 'Nueva tienda',
      diasActivos: 0,
      valorTotal: 0,
      modified: false,
      isNew: true,
    }
    onRowsChange([...month.rows, newRow])
    setTimeout(() => {
      setEditingCell({ rowId: newRow.id, col: 'tienda' })
      setEditValue(newRow.tienda)
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
    }, 50)
  }

  const total = month.rows.reduce((s, r) => s + r.valorTotal, 0)
  const modified = month.rows.filter((r) => r.modified).length
  const added = month.rows.filter((r) => r.isNew).length

  return (
    <div className="flex flex-col gap-3">
      {/* Table meta */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{month.rows.length} registros</span>
          {modified > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-highlight bg-highlight/10 px-2 py-0.5 rounded-md">
              <Pencil className="w-2.5 h-2.5" />
              {modified} editado{modified !== 1 ? 's' : ''}
            </span>
          )}
          {added > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-md">
              <Plus className="w-2.5 h-2.5" />
              {added} nuevo{added !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            Total:{' '}
            <span className="text-foreground font-semibold">{formatCurrency(total)}</span>
          </span>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success
              text-xs font-semibold hover:bg-success/20 transition-colors border border-success/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar fila
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-auto" style={{ maxHeight: 420 }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Tienda</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground w-28">
                Dias Activos
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground w-36">
                Valor Total
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {month.rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/40 transition-colors hover:bg-surface-raised group',
                  row.isNew ? 'bg-success/5' : row.modified ? 'bg-highlight/5' : '',
                )}
              >
                {/* Tienda */}
                <td className="px-4 py-2">
                  {editingCell?.rowId === row.id && editingCell.col === 'tienda' ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingCell(null)
                      }}
                      className="w-full bg-input border border-primary rounded-md px-2 py-0.5 text-sm text-foreground focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(row, 'tienda')}
                      className={cn(
                        'flex items-center gap-1.5 text-left w-full group/cell',
                        row.isNew ? 'text-success' : row.modified ? 'text-highlight' : 'text-foreground',
                      )}
                    >
                      <span>{row.tienda}</span>
                      <Pencil className="w-3 h-3 opacity-0 group-hover/cell:opacity-40 transition-opacity text-muted-foreground shrink-0" />
                    </button>
                  )}
                </td>

                {/* Dias Activos */}
                <td className="px-4 py-2 text-right">
                  {editingCell?.rowId === row.id && editingCell.col === 'diasActivos' ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingCell(null)
                      }}
                      className="w-20 bg-input border border-primary rounded-md px-2 py-0.5 text-sm text-right text-foreground focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(row, 'diasActivos')}
                      className={cn(
                        'inline-flex items-center gap-1 justify-end w-full group/cell',
                        row.modified || row.isNew ? 'text-inherit' : 'text-muted-foreground',
                      )}
                    >
                      <Pencil className="w-3 h-3 opacity-0 group-hover/cell:opacity-40 text-muted-foreground transition-opacity" />
                      {row.diasActivos}
                    </button>
                  )}
                </td>

                {/* Valor Total */}
                <td className="px-4 py-2 text-right">
                  {editingCell?.rowId === row.id && editingCell.col === 'valorTotal' ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingCell(null)
                      }}
                      className="w-36 bg-input border border-primary rounded-md px-2 py-0.5 text-sm text-right font-mono text-foreground focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(row, 'valorTotal')}
                      className="inline-flex items-center gap-1 justify-end w-full font-mono text-xs group/cell text-foreground"
                    >
                      <Pencil className="w-3 h-3 opacity-0 group-hover/cell:opacity-40 text-muted-foreground transition-opacity" />
                      {formatCurrency(row.valorTotal)}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => deleteRow(row.id)}
                    aria-label="Eliminar fila"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                      opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-surface-raised sticky bottom-0">
              <td className="px-4 py-2.5 text-xs font-bold text-foreground">TOTAL</td>
              <td />
              <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-foreground">
                {formatCurrency(total)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export function Step3Review({ months, onMonthsUpdate, onRecalculate, onNext, onBack }: Step3ReviewProps) {
  const [activeTab, setActiveTab] = useState(0)
  // Track if data has changed since last recalculate
  const [dirty, setDirty] = useState(false)

  const updateRows = (idx: number, rows: StoreRow[]) => {
    onMonthsUpdate(months.map((m, i) => (i === idx ? { ...m, rows } : m)))
    setDirty(true)
  }

  const handleRecalculate = () => {
    onRecalculate()
    setDirty(false)
  }

  const monthTotals = months.map((m) => m.rows.reduce((s, r) => s + r.valorTotal, 0))
  const totalModified = months.reduce((s, m) => s + m.rows.filter((r) => r.modified || r.isNew).length, 0)

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Revisar y corregir datos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Haz clic en cualquier celda para editar. Puedes agregar o eliminar filas.
          </p>
        </div>
        {dirty && (
          <button
            onClick={handleRecalculate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-highlight/15 border border-highlight/30
              text-highlight text-sm font-semibold hover:bg-highlight/25 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recalcular informe
          </button>
        )}
      </div>

      {/* Summary comparison bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {months.map((m, idx) => {
          const total = monthTotals[idx]
          const mod = m.rows.filter((r) => r.modified || r.isNew).length
          return (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs text-muted-foreground">{m.name} {m.year}</p>
                <p className="text-sm font-bold text-foreground font-mono mt-0.5">
                  {formatCurrency(total)}
                </p>
              </div>
              {mod > 0 ? (
                <span className="text-xs font-medium text-highlight bg-highlight/10 px-2 py-0.5 rounded-md shrink-0">
                  {mod} cambio{mod !== 1 ? 's' : ''}
                </span>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-input rounded-xl p-1 w-fit">
        {months.map((month, idx) => {
          const modCount = month.rows.filter((r) => r.modified || r.isNew).length
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === idx
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {month.name}
              <span className="text-xs text-muted-foreground font-mono">{month.year}</span>
              {modCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-highlight text-highlight-foreground text-[10px] font-bold flex items-center justify-center">
                  {modCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active tab content */}
      {months.map((month, idx) => (
        <div key={idx} className={activeTab === idx ? 'block' : 'hidden'}>
          <MonthTable month={month} onRowsChange={(rows) => updateRows(idx, rows)} />
        </div>
      ))}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card
            text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          {totalModified > 0 && !dirty && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {totalModified} cambio{totalModified !== 1 ? 's' : ''} incluido{totalModified !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-primary text-primary-foreground
              font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            Ver informe
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
