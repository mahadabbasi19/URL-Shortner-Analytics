export interface User {
  id: string
  email: string
  created_at: string
}

export interface UrlItem {
  id: string
  original_url: string
  short_code: string
  custom_alias: string | null
  title: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
  is_active: boolean
  total_clicks: number
}

export interface UrlCreateResponse extends UrlItem {
  short_url: string
}

export interface NamedCount {
  name: string
  count: number
}

export interface ClicksOverTimePoint {
  date: string
  count: number
}

export interface UrlAnalytics {
  total_clicks: number
  unique_visitors: number
  clicks_today: number
  clicks_over_time: ClicksOverTimePoint[]
  top_countries: NamedCount[]
  top_cities: NamedCount[]
  top_referrers: NamedCount[]
  browsers: NamedCount[]
  operating_systems: NamedCount[]
  devices: NamedCount[]
}
