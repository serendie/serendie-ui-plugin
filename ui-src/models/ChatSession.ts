import { ModelMessage } from 'ai'
import { ImageMetas } from '../utils/getImageMetaKey'

export interface ChatSession {
  id: string
  title: string
  messages: ModelMessage[]
  imageMetas: ImageMetas
  createdAt: number
  updatedAt: number
}
