import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { JournalEntry } from '../types'

export function useJournal(userId: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  // past entries
  const fetchEntries = async () => {
    if (!userId) return
    setLoadingEntries(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) setEntries(data)
    setLoadingEntries(false)
  }

  // Saving new entry to Supabase
  const saveEntry = async (
    content: string,
    aiResponse: string,
    moodScore: number
  ) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        content,
        ai_response: aiResponse,
        mood_score: moodScore,
      })
      .select()
      .single()

    if (!error && data) {
      // Adding new entry to top
      setEntries((prev) => [data, ...prev])
    }

    return { error }
  }

  return { entries, loadingEntries, fetchEntries, saveEntry }
}