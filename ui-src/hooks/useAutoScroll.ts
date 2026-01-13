import { useCallback, useEffect, useRef } from 'react'

export function useAutoScroll<T>(dependency: T) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAutoScrollRef = useRef(true)

  // スクロール位置の監視
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 8
      isAutoScrollRef.current = isAtBottom
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // NOTE: 依存値が更新されたら自動スクロール
  useEffect(() => {
    if (isAutoScrollRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
    }
  }, [dependency])

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight
      isAutoScrollRef.current = true
    }
  }, [])

  return { scrollContainerRef, scrollToBottom }
}
