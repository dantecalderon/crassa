
import { useEffect, useRef, EffectCallback } from 'react'

const { NODE_ENV } = process.env

export const useComponentDidMount = (func: EffectCallback) => useEffect(func, [])

export const useComponentWillMount = (func: EffectCallback) => {
  const willMount = useRef(true)

  if(willMount.current && NODE_ENV === 'production')
    func()

  useComponentDidMount(() => {
    willMount.current = false
    if(NODE_ENV === 'development')
      func()
  })
}
