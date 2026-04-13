'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle,
  ChevronRight, ChevronLeft, Loader2,
} from 'lucide-react'
import { MonthData } from '@/lib/types'
import { parseExcelFile } from '@/lib/excel'
import { cn } from '@/lib/utils'

interface Step2UploadProps {
  months: MonthData[]
  onMonthsUpdate: (months: MonthData[]) => void
  onNext: () => void
  onBack: () => void
}

function DropZone({
  month,
  loading,
  onFile,
  onRemove,
}: {
  month: MonthData
  loading: boolean
  onFile: (f: File) => void
  onRemove: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = (file: File) => {
    const ok =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    if (ok) onFile(file)
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) accept(file)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden',
        month.loaded
          ? 'border-success/40 bg-success/5'
          : dragging
          ? 'border-primary bg-primary/8 scale-[1.01]'
          : 'border-border bg-card hover:border-primary/40 hover:bg-primary/3',
      )}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Procesando...</p>
        </div>
      ) : month.loaded ? (
        <div className="flex flex-col items-center justify-center py-8 px-6 gap-3 text-center">
          <CheckCircle2 className="w-9 h-9 text-success" />
          <div>
            <p className="text-sm font-semibold text-foreground">{month.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
              {month.file?.name}
            </p>
            <p className="text-xs text-success mt-1">{month.rows.length} registros</p>
          </div>
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
          >
            <X className="w-3.5 h-3.5" /> Cambiar archivo
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center py-10 px-6 gap-3 text-center cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{month.name} {month.year}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arrastra o haz clic para subir
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">.xlsx / .xls / .csv</p>
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) accept(f) }}
      />
    </div>
  )
}

export function Step2Upload({ months, onMonthsUpdate, onNext, onBack }: Step2UploadProps) {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const allLoaded = months.every((m) => m.loaded)
  const loadedCount = months.filter((m) => m.loaded).length

  const handleFile = async (file: File, idx: number) => {
    setError(null)
    setLoadingIdx(idx)
    try {
      const rows = await parseExcelFile(file)
      if (rows.length === 0) {
        setError(
          `El archivo de ${months[idx].name} no tiene datos reconocibles. ` +
          'Verifica que tenga columnas: Tienda, Días Activos y Valor Total.',
        )
        setLoadingIdx(null)
        return
      }
      onMonthsUpdate(months.map((m, i) => (i === idx ? { ...m, file, rows, loaded: true } : m)))
    } catch {
      setError(`Error al leer el archivo de ${months[idx].name}. Verifica que sea un Excel válido.`)
    } finally {
      setLoadingIdx(null)
    }
  }

  const handleRemove = (idx: number) => {
    onMonthsUpdate(months.map((m, i) => (i === idx ? { ...m, file: null, rows: [], loaded: false } : m)))
    setError(null)
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-balance">Cargar archivos</h2>
        <p className="text-sm text-muted-foreground mt-2 text-pretty">
          Sube un archivo Excel para cada uno de los 3 meses del trimestre.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-input rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(loadedCount / 3) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          {loadedCount} / 3
        </span>
      </div>

      {/* Drop zones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {months.map((month, idx) => (
          <DropZone
            key={idx}
            month={month}
            loading={loadingIdx === idx}
            onFile={(f) => handleFile(f, idx)}
            onRemove={() => handleRemove(idx)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card
            text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          disabled={!allLoaded || loadingIdx !== null}
          onClick={onNext}
          className={cn(
            'flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-sm transition-all',
            allLoaded
              ? 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 active:scale-[0.98]'
              : 'bg-input text-muted-foreground cursor-not-allowed',
          )}
        >
          {loadingIdx !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Revisar datos
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
