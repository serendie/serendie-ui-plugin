import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

import ClientStorage from '../models/ClientStorage'
import notify from './notify'

type Response = {
  id: string
  object: string
  created: number
  model: string
  choices: {
    message: {
      role: string
      content: string
    }
  }[]
}

type MessageContent =
  | string
  | Array<{
      type: string
      text?: string
      image_url?: { url: string; detail?: string }
    }>

function validate(key: string) {
  if (key === '') {
    figma.notify('OpenAI API Key を設定してください', { timeout: 1000 })
    return false
  }
  return true
}

function getSchemaName<T>(schema: z.ZodSchema<T>): string {
  if ('_def' in schema && schema._def && 'typeName' in schema._def) {
    if (schema._def.typeName === 'ZodObject' && 'description' in schema._def) {
      return schema._def.description || 'Schema'
    }
  }

  const constructorName = schema.constructor.name
  if (constructorName && constructorName !== 'ZodObject') {
    return constructorName.replace('Zod', '')
  }

  return 'Schema'
}

export default async function generateObject<T>(
  schema: z.ZodSchema<T>,
  model: string,
  messages: { role: string; content: MessageContent }[]
): Promise<T | undefined> {
  const key = await figma.clientStorage.getAsync(ClientStorage.OPENAI_API_KEY)
  if (!validate(key)) {
    notify('OpenAI API Key is not set')
    return
  }

  const schemaName = getSchemaName(schema)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: zodResponseFormat(schema, schemaName),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error:', errorData)
    throw new Error(
      `OpenAI API error: ${errorData.error?.message || response.statusText}`
    )
  }

  try {
    const data = (await response.json()) as Response

    if (!data.choices || data.choices.length === 0) {
      console.error('No choices in response:', data)
      throw new Error('No response from OpenAI')
    }

    if (!data.choices[0].message || !data.choices[0].message.content) {
      console.error('No content in response:', data)
      throw new Error('Empty response from OpenAI')
    }

    return JSON.parse(data.choices[0].message.content)
  } catch (error) {
    console.error('Failed to parse OpenAI response', error)
    throw new Error(`Failed to parse OpenAI response: ${error}`)
  }
}
