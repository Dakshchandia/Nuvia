import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface UserProfile {
  name: string
  age: number | null
  pregnancy_status: string | null   // 'yes' | 'no' | null
  pregnancy_month: number | null
  onboarding_complete: boolean
}

const EMPTY: UserProfile = {
  name: '', age: null,
  pregnancy_status: null, pregnancy_month: null,
  onboarding_complete: false,
}

const KEY = 'nuvia_profile'

function read(): UserProfile {
  try {
    const s = sessionStorage.getItem(KEY)
    return s ? JSON.parse(s) : EMPTY
  } catch { return EMPTY }
}
function write(p: UserProfile) {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)) } catch { /**/ }
}

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(read)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfile()
      .then(p => {
        const merged: UserProfile = {
          name: p.name,
          age: p.age,
          pregnancy_status: p.pregnancy_status,
          pregnancy_month: p.pregnancy_month,
          onboarding_complete: p.onboarding_complete,
        }
        setProfileState(merged)
        write(merged)
      })
      .catch(() => { /* keep session state */ })
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = useCallback(async (data: Omit<UserProfile, 'onboarding_complete'>) => {
    const r = await api.saveProfile({
      name: data.name,
      age: data.age ?? 0,
      pregnancy_status: data.pregnancy_status ?? undefined,
      pregnancy_month: data.pregnancy_month ?? undefined,
    })
    const updated: UserProfile = {
      ...data,
      onboarding_complete: r.onboarding_complete,
    }
    setProfileState(updated)
    write(updated)
    return updated
  }, [])

  return { profile, loading, saveProfile }
}
