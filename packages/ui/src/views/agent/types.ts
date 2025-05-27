export interface Agent {
  id: number
  name: string
  prefix: string
  rules: {
    from: string
    to: string
  }[]
}
