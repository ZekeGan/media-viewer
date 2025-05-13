import { useEffect, useRef, useState } from 'react'
import {
  Image,
  Skeleton,
  ImageProps,
  PolymorphicComponentProps,
  Box,
  Paper,
} from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import LoadingContainer from './LoadingContainer'

export const ObserverImg = ({
  src,
  alt,
  w = 4,
  h = 3,
  ...props
}: PolymorphicComponentProps<'img', ImageProps>) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const aspectRatio =
    typeof w === 'number' && typeof h === 'number'
      ? Number(w) / Number(h)
      : 4 / 3

  // IntersectionObserver 啟動 lazy load
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImgSrc(src)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [src])

  const handleLoad = () => {
    setHasLoaded(true)
    setHasError(false)
  }

  const handleError = () => {
    setHasError(true)
    setHasLoaded(true)
  }

  return (
    <Box ref={ref} style={{ aspectRatio }}>
      {imgSrc && (
        <Image
          w="100%"
          h="100%"
          src={hasError ? noImg.src : imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          fit="contain"
          loading="lazy"
          {...props}
        />
      )}
    </Box>
  )
}
