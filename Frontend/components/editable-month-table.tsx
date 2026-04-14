'use client'

import { useState, useRef } from 'react'
import { Pencil, RotateCcw } from 'lucide-react'
import { MonthData, StoreRow, formatCurrency } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EditableMonthTableProps {
  month: MonthData
  onRowsChange: (rows: StoreRow[]) => void
}

type EditingCell = { rowId: string; col: 'tienda' | 'diasActivos' | 'valorTotal' } | null

export function EditableMonthTable({ month, onRowsChange }: EditableMonthTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = (row: StoreRow, col: 'tienda' | 'diasActivos' | 'valorTotal') => {
    setEditingCell({ rowId: row.id, col })
    setEditValue(String(row[col]))
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const commitEdit = () => {
    if (!editingCell) return
    const { rowId, col } = editingCell
    const updated = month.rows.map((row) => {
      if (row.id !== rowId) return row
      let newVal: string | number = editValue
      if (col === 'diasActivos') {
        newVal = parseInt(editValue) || 0
      } else if (col === 'valorTotal') {
        newVal = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0
      }
      const changed = row[col] !== newVal
      return { ...row, [col]: newVal, modified: changed ? true : row.modified }
    })
    onRowsChange(updated)
    setEditingCell(null)
  }

  const resetRow = (rowId: string) => {
    // We can't truly reset to original since we don't store it — we just mark it unmodified
    const updated = month.rows.map((r) =>
      r.id === rowId ? { ...r, modified: false } : r,
    )
    onRowsChange(updated)
  }

  const totalValor = month.rows.reduce((s, r) => s + r.valorTotal, 0)
  const modifiedCount = month.rows.filter((r) => r.modified).length

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Table stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {month.rows.length} tiendas
          </span>
          {modifiedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-highlight font-medium bg-highlight/10 px-2 py-0.5 rounded-md">
              <Pencil className="w-2.5 h-2.5" />
              {modifiedCount} modificado{modifiedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          Total: <span className="text-foreground font-semibold">{formatCurrency(totalValor)}</span>
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Tienda
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Días Activos
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Valor Total
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {month.rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  row.modified
                    ? 'bg-highlight/5'
                    : idx % 2 === 0
                    ? 'bg-transparent'
                    : 'bg-surface-raised/30',
                  'hover:bg-surface-raised',
                )}
              >
                {/* Tienda */}
                <td className="px-4 py-2 relative">
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
                    <span
                      className={cn(
                        'flex items-center gap-1.5 cursor-pointer group',
                        row.modified && 'text-highlight',
                      )}
                      onClick={() => startEdit(row, 'tienda')}
                    >
                      {row.tienda}
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground shrink-0" />
                    </span>
                  )}
                </td>

                {/* Días Activos */}
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
                      className="w-20 bg-input border border-primary rounded-md px-2 py-0.5 text-sm text-foreground focus:outline-none text-right"
                    />
                  ) : (
                    <span
                      className={cn(
                        'cursor-pointer group inline-flex items-center gap-1 justify-end',
                        row.modified && 'text-highlight',
                      )}
                      onClick={() => startEdit(row, 'diasActivos')}
                    >
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground" />
                      {row.diasActivos}
                    </span>
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
                      className="w-36 bg-input border border-primary rounded-md px-2 py-0.5 text-sm text-foreground focus:outline-none text-right font-mono"
                    />
                  ) : (
                    <span
                      className={cn(
                        'cursor-pointer group inline-flex items-center gap-1 justify-end font-mono text-xs',
                        row.modified && 'text-highlight',
                      )}
                      onClick={() => startEdit(row, 'valorTotal')}
                    >
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground" />
                      {formatCurrency(row.valorTotal)}
                    </span>
                  )}
                </td>

                {/* Reset */}
                <td className="px-2 py-2">
                  {row.modified && (
                    <button
                      title="Quitar marcador de modificado"
                      onClick={() => resetRow(row.id)}
                      className="w-6 h-6 rounded-md hover:bg-surface-raised flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-raised">
              <td className="px-4 py-2.5 text-xs font-bold text-foreground">TOTAL</td>
              <td />
              <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground font-mono">
                {formatCurrency(totalValor)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
