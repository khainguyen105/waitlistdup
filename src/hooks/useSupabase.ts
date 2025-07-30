import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('locations').select('count').limit(1)
      
      if (error) {
        setError(`Supabase connection error: ${error.message}`)
        setIsConnected(false)
      } else {
        setIsConnected(true)
        setError(null)
      }
    } catch (err) {
      setError(`Failed to connect to Supabase: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsConnected(false)
    }
  }

  const callFunction = async (functionName: string, payload?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      })

      if (error) {
        throw error
      }

      return data
    } catch (err) {
      console.error(`Error calling function ${functionName}:`, err)
      throw err
    }
  }

  return {
    isConnected,
    error,
    checkConnection,
    callFunction,
    supabase,
  }
}