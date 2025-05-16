import noImg from '@/assets/no-image.jpg'
import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Image,
  ImageProps,
  PolymorphicComponentProps,
} from '@mantine/core'

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
    <Box
      ref={el => {
        if (el) ref.current = el
      }}
      w="100%"
      h="100%"
    >
      {imgSrc && (
        <Image
          src={hasError ? noImg.src : imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          fit="contain"
          loading="lazy"
          {...props}
          w="100%"
          h="100%"
          opacity={hasLoaded ? 1 : 0.5}
          style={{
            transition: 'opacity 0.5s ease',
          }}
        />
      )}
    </Box>
  )
}
