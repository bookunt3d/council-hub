export interface Sage {
  id: string
  name: string
  emoji: string
  role: 'chair' | 'secretary' | 'member'
  desc: string
  lens: string
  work: string
  quote: string
}

export interface SageMessage {
  sageId: string
  content: string
}

export interface CouncilSession {
  question: string
  panel: string
  step: number // 1 | 2 | 3
  history: SageMessage[]
  createdAt: number
  updatedAt: number
}

export type PanelKey = 'quick' | 'full' | 'all'

export interface Env {
  KEYS: KVNamespace
  SESSIONS: KVNamespace
  TELEGRAM_BOT_TOKEN: string
}
