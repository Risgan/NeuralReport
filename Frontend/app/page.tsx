'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, Brain, Sun, Moon } from 'lucide-react'
import {
  AppStep,
  TaxConfig,
  DEFAULT_TAX_CONFIG,
  MonthData,
  ReportRow,
  HistoryEntry,
  MONTHS_SHORT,
  getQuarterMonths,
  computeReport,
} from '@/lib/types'
import { Step1Period } from '@/components/step1-period'
import { Step2Upload } from '@/components/step2-upload'
import { Step3Review } from '@/components/step3-review'
import { Step4Report } from '@/components/step4-report'
import { TaxConfigModal } from '@/components/tax-config-modal'
import { HistoryPanel } from '@/components/history-panel'
import { cn } from '@/lib/utils'

const STEPS: { id: AppStep; label: string }[] = [
  { id: 'period', label: 'Periodo' },
  { id: 'upload', label: 'Archivos' },
  { id: 'review', label: 'Revision' },
  { id: 'report', label: 'Informe' },
]

const today = new Date()
const defaultStartMonth = Math.floor(today.getMonth() / 3) * 3

function WizardStepper({ current }: { current: AppStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current)
  return (
    <nav aria-label="Pasos del proceso" className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isDone   = idx < currentIdx
        const isActive = idx === currentIdx
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
                    : 'bg-input text-muted-foreground border border-border',
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium hidden md:block whitespace-nowrap',
                  isActive ? 'text-foreground' : isDone ? 'text-primary' : 'text-muted-foreground/50',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-12 md:w-16 mx-1 mb-5 transition-all',
                  idx < currentIdx ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function Home() {
  const [step, setStep]           = useState<AppStep>('period')
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX_CONFIG)
  const [startMonth, setStartMonth] = useState(defaultStartMonth)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [months, setMonths]       = useState<MonthData[]>(getQuarterMonths(defaultStartMonth, today.getFullYear()))
  const [reportRows, setReportRows] = useState<ReportRow[]>([])
  const [history, setHistory]     = useState<HistoryEntry[]>([])
  const [dark, setDark]           = useState(true)

  // Apply dark class to html element
  useEffect(() => {
    const html = document.documentElement
    if (dark) html.classList.add('dark')
    else html.classList.remove('dark')
  }, [dark])

  // ── Step navigation ──────────────────────────────────────────────────────────

  const handlePeriodChange = (month: number, year: number) => {
    setStartMonth(month)
    setSelectedYear(year)
    setMonths(getQuarterMonths(month, year))
    setReportRows([])
  }

  const handleUploadNext = useCallback(() => setStep('review'), [])

  const handleReviewNext = useCallback(() => {
    const rows = computeReport(months, taxConfig)
    setReportRows(rows)
    setStep('report')
  }, [months, taxConfig])

  // Recalculate in-place while staying on the review step
  const handleRecalculate = useCallback(() => {
    const rows = computeReport(months, taxConfig)
    setReportRows(rows)
  }, [months, taxConfig])

  const handleTaxChange = (cfg: TaxConfig) => {
    setTaxConfig(cfg)
    if (step === 'report') {
      setReportRows(computeReport(months, cfg))
    }
  }

  // ── Finalize: save to history ────────────────────────────────────────────────
  const handleFinalize = useCallback(() => {
    const m0 = months[0]
    const m2 = months[2]
    const label = `${MONTHS_SHORT[m0.index]} – ${MONTHS_SHORT[m2.index]} ${m0.year}`
    const period = `${MONTHS_SHORT[m0.index]}_${MONTHS_SHORT[m2.index]}_${m0.year}`
    const grossTotal = reportRows.reduce((s, r) => s + r.valorTotal, 0)
    const netTotal   = reportRows.reduce((s, r) => s + r.totalNeto, 0)

    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      period,
      label,
      months: months.map((m) => ({ ...m, file: null })), // File not serializable
      reportRows: [...reportRows],
      taxConfig: { ...taxConfig },
      grossTotal,
      netTotal,
      storeCount: reportRows.length,
    }
    setHistory((prev) => [...prev, entry])
  }, [months, reportRows, taxConfig])

  // ── Restore from history ─────────────────────────────────────────────────────
  const handleRestore = (entry: HistoryEntry) => {
    setMonths(entry.months)
    setReportRows(entry.reportRows)
    setTaxConfig(entry.taxConfig)
    setStep('report')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">NeuralReport</h1>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5 hidden sm:block">
                Informe Trimestral
              </p>
            </div>
          </div>

          {/* Stepper */}
          <WizardStepper current={step} />

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <HistoryPanel
              entries={history}
              onClear={() => setHistory([])}
              onDelete={(id) => setHistory((prev) => prev.filter((e) => e.id !== id))}
              onRestore={handleRestore}
            />
            <TaxConfigModal config={taxConfig} onChange={handleTaxChange} />
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Cambiar tema"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-card
                text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        {step === 'period' && (
          <Step1Period
            selectedMonth={startMonth}
            selectedYear={selectedYear}
            onChange={handlePeriodChange}
            onNext={() => setStep('upload')}
          />
        )}
        {step === 'upload' && (
          <Step2Upload
            months={months}
            onMonthsUpdate={setMonths}
            onNext={handleUploadNext}
            onBack={() => setStep('period')}
          />
        )}
        {step === 'review' && (
          <Step3Review
            months={months}
            onMonthsUpdate={setMonths}
            onRecalculate={handleRecalculate}
            onNext={handleReviewNext}
            onBack={() => setStep('upload')}
          />
        )}
        {step === 'report' && (
          <Step4Report
            months={months}
            reportRows={reportRows}
            taxConfig={taxConfig}
            onBack={() => setStep('review')}
            onFinalize={handleFinalize}
          />
        )}
      </main>
    </div>
  )
}
