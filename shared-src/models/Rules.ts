export const LIBRARY_NAME = '🛠️ Serendie UI Kit'
export const UNEXPECTED = 'Unexpected'

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
