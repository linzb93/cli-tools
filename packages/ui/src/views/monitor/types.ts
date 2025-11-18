export interface Application {
  siteId: string
  name: string
}
export interface ErrorItem {
  content: string
  errorCount: string
  url: string
  numberOfAffectedUsers: string
  id: string
}
export interface PanelItem {
  siteId: string
  title: string
  data: ErrorItem[]
}
export interface ErrorDetailItem {
  errorMsg: string
}
