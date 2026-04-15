'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { History, X, Download, Trash2, Clock, ChevronRight } from 'lucide-react'
import { HistoryEntry, formatCurrency } from '@/lib/types'
import { exportConsolidated } from '@/lib/excel'
import { cn } from '@/lib/utils'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onClear: () => void
  onDelete: (id: string) => void
  onRestore: (entry: HistoryEntry) => void
}

function EntryCard({
  entry,
  onDelete,
  onRestore,
  onDownload,
}: {
  entry: HistoryEntry
  onDelete: () => void
  onRestore: () => void
  onDownload: () => void
}) {
  const date = new Date(entry.createdAt)
  const dateLabel = date.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const timeLabel = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{entry.label}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{dateLabel} &bull; {timeLabel}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          aria-label="Eliminar del historial"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground opacity-0
            group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Tiendas</p>
          <p className="text-xs font-bold text-foreground">{entry.storeCount}</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Bruto</p>
          <p className="text-[11px] font-bold text-success font-mono truncate">{formatCurrency(entry.grossTotal)}</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Neto</p>
          <p className="text-[11px] font-bold text-primary font-mono truncate">{formatCurrency(entry.netTotal)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border
            text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar
        </button>
        <button
          onClick={onRestore}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10
            text-xs font-medium text-primary hover:bg-primary/20 border border-primary/20 transition-all"
        >
          Ver informe
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function HistoryPanel({ entries, onClear, onDelete, onRestore }: HistoryPanelProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const drawer = (
    <div
      className="fixed inset-0 z-[9999] flex justify-end"
      aria-modal="true"
      role="dialog"
      aria-label="Historial de informes"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Historial</h2>
              <p className="text-[11px] text-muted-foreground">
                {entries.length} informe{entries.length !== 1 ? 's' : ''} guardado{entries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpiar todo
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar historial"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
                hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-16">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <History className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sin historial</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Los informes finalizados aparecen aqui automaticamente.
                </p>
              </div>
            </div>
          ) : (
            [...entries].reverse().map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => onDelete(entry.id)}
                onRestore={() => { onRestore(entry); setOpen(false) }}
                onDownload={() =>
                  exportConsolidated(
                    entry.months,
                    entry.reportRows,
                    entry.taxConfig,
                    `NeuralReport_${entry.period}.xlsx`,
                  )
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card',
          'text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all',
        )}
        title="Historial de informes"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">Historial</span>
        {entries.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground
            text-[10px] font-bold flex items-center justify-center">
            {entries.length > 9 ? '9+' : entries.length}
          </span>
        )}
      </button>

      {/* Portal — renders outside the header DOM tree */}
      {mounted && open && createPortal(drawer, document.body)}
    </>
  )
}
