'use client'

import { useState } from 'react'
import { CalendarDays, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { MONTHS_ES, MONTHS_SHORT, AVAILABLE_YEARS, getQuarterMonths, MonthData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Step1PeriodProps {
  selectedMonth: number
  selectedYear: number
  onChange: (month: number, year: number) => void
  onNext: () => void
}

const BASE_YEAR = new Date().getFullYear()

export function Step1Period({ selectedMonth, selectedYear, onChange, onNext }: Step1PeriodProps) {
  // Extra years the user can add manually (exercise requirement)
  const [extraYears, setExtraYears] = useState<number[]>([])
  const [addingYear, setAddingYear] = useState(false)
  const [newYearInput, setNewYearInput] = useState('')
  const [newYearError, setNewYearError] = useState('')

  const allYears = [
    ...AVAILABLE_YEARS,
    ...extraYears.filter((y) => !AVAILABLE_YEARS.includes(y)),
  ].sort((a, b) => a - b)

  const handleAddYear = () => {
    const y = parseInt(newYearInput)
    if (isNaN(y) || y < 2000 || y > 2100) {
      setNewYearError('Ingresa un año válido entre 2000 y 2100')
      return
    }
    if (allYears.includes(y)) {
      setNewYearError('Ese año ya está en la lista')
      return
    }
    setExtraYears((prev) => [...prev, y])
    setNewYearInput('')
    setNewYearError('')
    setAddingYear(false)
    onChange(selectedMonth, y)
  }

  const handleRemoveYear = (y: number) => {
    setExtraYears((prev) => prev.filter((x) => x !== y))
    if (selectedYear === y) onChange(selectedMonth, BASE_YEAR)
  }

  const quarter: MonthData[] = getQuarterMonths(selectedMonth, selectedYear)

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
          <CalendarDays className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-balance">Selecciona el periodo</h2>
        <p className="text-sm text-muted-foreground mt-2 text-pretty">
          Elige el mes de inicio y el año. Se generarán automáticamente los 3 meses del trimestre.
        </p>
      </div>

      {/* Year selector */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-raised flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Año</p>
          <button
            onClick={() => { setAddingYear(true); setNewYearError('') }}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar año
          </button>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2">
          {allYears.map((year) => {
            const isExtra = !AVAILABLE_YEARS.includes(year)
            return (
              <div key={year} className="relative group">
                <button
                  onClick={() => onChange(selectedMonth, year)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                    year === selectedYear
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-input border border-border text-muted-foreground hover:text-foreground hover:border-primary/40',
                    isExtra && year !== selectedYear && 'border-dashed',
                  )}
                >
                  {year}
                </button>
                {isExtra && (
                  <button
                    onClick={() => handleRemoveYear(year)}
                    aria-label={`Eliminar año ${year}`}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground
                      opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Inline add year form */}
          {addingYear && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                placeholder="2027"
                value={newYearInput}
                onChange={(e) => { setNewYearInput(e.target.value); setNewYearError('') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddYear()
                  if (e.key === 'Escape') { setAddingYear(false); setNewYearError('') }
                }}
                className="w-24 bg-input border border-primary rounded-lg px-3 py-2 text-sm text-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              />
              <button
                onClick={handleAddYear}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                OK
              </button>
              <button
                onClick={() => { setAddingYear(false); setNewYearError('') }}
                className="px-3 py-2 rounded-lg bg-input border border-border text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        {newYearError && (
          <p className="px-5 pb-3 text-xs text-destructive">{newYearError}</p>
        )}
      </div>

      {/* Month grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-raised">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mes de inicio del trimestre
          </p>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {MONTHS_ES.map((month, idx) => {
              const isStart = idx === selectedMonth
              const qOffset = (idx - selectedMonth + 12) % 12
              const isInQ = qOffset === 1 || qOffset === 2

              return (
                <button
                  key={month}
                  onClick={() => onChange(idx, selectedYear)}
                  title={month}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-medium transition-all text-center',
                    isStart
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-md shadow-primary/15'
                      : isInQ
                      ? 'bg-primary/12 text-primary border border-primary/25 hover:bg-primary/20'
                      : 'bg-input border border-border text-muted-foreground hover:text-foreground hover:border-primary/30',
                  )}
                >
                  {MONTHS_SHORT[idx]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quarter preview */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Trimestre seleccionado
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {quarter.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-center min-w-[80px]">
                <p className="text-xs text-muted-foreground">{m.year}</p>
                <p className="text-sm font-bold text-primary">{m.name}</p>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Next */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground
            font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
        >
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
