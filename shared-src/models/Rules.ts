export const LIBRARY_NAME = '🛠️ Serendie UI Kit'
export const MANUAL_VALUE = 'Manual Value'

export type IssueDetail = {
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
}

export type Issue = {
  nodeId: string
  nodeName: string
  nodeType: string
} & IssueDetail
