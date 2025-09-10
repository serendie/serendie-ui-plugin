/**
 * Color validation models
 */

export interface ColorIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion: string
}

export interface ColorValidationIssue extends ColorIssue {
  nodeId: string
  nodeName: string
  textColor: string
  backgroundColor: string
}

export interface ColorValidationResult {
  isValid: boolean
  totalIssues: number
  issues: ColorValidationIssue[]
  summary: string
}
