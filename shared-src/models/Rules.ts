/**
 * Color validation models
 */

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

export type Result = {
  totalIssues: number
  issues: Issue[]
}
