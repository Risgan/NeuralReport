export interface Year {
  id: number
  year: number
  active: boolean
}

export interface Month {
  id: number
  month_name: string
  month_initials: string
}

export interface Status {
  id: number
  name: string
  active: boolean
}

export interface Param {
  id: number
  name: string
  value: number
  description: string
  active: boolean
}

export interface BaseCatalogsResponse {
  years: Year[]
  params: Param[]
  months?: Month[]
  status?: Status[]
}
