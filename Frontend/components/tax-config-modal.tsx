'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Settings2, X, RotateCcw, Info } from 'lucide-react'
import { TaxConfig, DEFAULT_TAX_CONFIG } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TaxConfigModalProps {
  config: TaxConfig
  onChange: (c: TaxConfig) => void
}

function NumberInput({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string
  suffix: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        <input
          type="number"
          step="0.001"
          min="0"
          max="100"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
          className="w-full bg-input border border-border rounded-lg pl-3 pr-12 py-2.5 text-sm font-mono
            text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
        <span className="absolute right-3 text-xs text-muted-foreground font-mono">{suffix}</span>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function ModeToggle({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string
  options: { value: string; label: string; description: string }[]
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className={cn('grid gap-2', options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all',
              value === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-input text-muted-foreground hover:text-foreground hover:border-primary/30',
            )}
          >
            <span className="text-xs font-semibold">{opt.label}</span>
            <span className={cn('text-[10px] leading-tight', value === opt.value ? 'text-primary/70' : 'text-muted-foreground/60')}>
              {opt.description}
            </span>
          </button>
        ))}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

export function TaxConfigModal({ config, onChange }: TaxConfigModalProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TaxConfig>(config)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleOpen = () => {
    setDraft(config)
    setOpen(true)
  }

  const handleApply = () => {
    onChange(draft)
    setOpen(false)
  }

  const handleReset = () => setDraft(DEFAULT_TAX_CONFIG)

  const update = (key: keyof TaxConfig) => (v: number | string) => {
    setDraft((prev) => ({ ...prev, [key]: v }))
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Configuracion de calculo"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Configuracion de Calculo</h3>
              <p className="text-xs text-muted-foreground">Tasas e impuestos del informe</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar configuracion"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground
              hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">

          {/* Tasas impositivas */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary inline-block" />
              Tasas impositivas
            </p>
            <NumberInput
              label="IVA"
              suffix="%"
              value={draft.iva}
              onChange={update('iva') as (v: number) => void}
              hint="Se aplica sobre el Valor Total de cada fila"
            />
            <NumberInput
              label="ReteFuente"
              suffix="%"
              value={draft.reteFuente}
              onChange={update('reteFuente') as (v: number) => void}
              hint="Retencion en la fuente"
            />
            <NumberInput
              label="ReteICA"
              suffix="%"
              value={draft.reteICA}
              onChange={update('reteICA') as (v: number) => void}
              hint="Retencion de ICA municipal"
            />
          </div>

          <div className="h-px bg-border" />

          {/* Precio del importe */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-success inline-block" />
              Precio del importe
            </p>
            <NumberInput
              label="Precio unitario"
              suffix="$"
              value={draft.precioImporte}
              onChange={update('precioImporte') as (v: number) => void}
              hint="Precio base para calcular el importe por tienda"
            />
            <ModeToggle
              label="Modo de calculo del importe"
              value={draft.importeMode}
              onChange={update('importeMode') as (v: string) => void}
              options={[
                { value: 'unit',  label: 'Por dias',      description: 'Precio x Dias Activos' },
                { value: 'flat',  label: 'Valor fijo',    description: 'Mismo precio / tienda' },
                { value: 'none',  label: 'No aplicar',    description: 'Ocultar columna' },
              ]}
            />
          </div>

          <div className="h-px bg-border" />

          {/* Formula del Total Neto */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-highlight inline-block" />
              Formula del Total Neto
            </p>
            <ModeToggle
              label="Modo IVA"
              value={draft.ivaMode}
              onChange={update('ivaMode') as (v: string) => void}
              options={[
                { value: 'add',  label: 'Sumar IVA',      description: 'Total + IVA' },
                { value: 'none', label: 'Solo informativo', description: 'No afecta el total' },
              ]}
            />
            <ModeToggle
              label="Modo Retenciones"
              value={draft.retentionMode}
              onChange={update('retentionMode') as (v: string) => void}
              options={[
                { value: 'deduct', label: 'Descontar',       description: '- ReteFuente - ReteICA' },
                { value: 'none',   label: 'Solo informativo', description: 'No afecta el total' },
              ]}
            />

            {/* Formula preview */}
            <div className="rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Formula resultante
              </p>
              <p className="text-sm font-mono text-foreground">
                Total Neto = Valor Total
                {draft.ivaMode === 'add' && (
                  <span className="text-success"> + IVA</span>
                )}
                {draft.retentionMode === 'deduct' && (
                  <>
                    <span className="text-destructive"> - ReteFuente</span>
                    <span className="text-destructive"> - ReteICA</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-medium
                text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold
                hover:brightness-110 transition-all shadow-md shadow-primary/20"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card
          text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        title="Configuracion de impuestos"
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Configuracion</span>
      </button>

      {/* Portal — renders outside the header DOM tree */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  )
}
