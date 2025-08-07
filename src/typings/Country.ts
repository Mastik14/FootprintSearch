export type Country = {
  countryCode: string
  countryName: string
  isoa2: string
  score: string
  shortName: string
}

export type CountryEmissionsForYear = {
  year: number
  shortName: string
  countryCode: number
  countryName: string
  record: string
  cropLand: number
  grazingLand: number
  forestLand: number
  fishingGround: number
  builtupLand: number
  carbon: number // this represents the emissions for that year
  score: string
  value: number
}