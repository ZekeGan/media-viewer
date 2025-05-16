import noImg from '@/assets/no-image.jpg'
import { useState } from 'react'
import { Image, ImageProps, PolymorphicComponentProps } from '@mantine/core'

export function Img({
  src,
  alt,
  ...rest
}: PolymorphicComponentProps<'img', ImageProps>) {
  const [loaded, setLoaded] = useState(false)

  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = noImg.src
  }

  return (
    <Image
      src={src}
      alt={alt}
      w="100%"
      h="100%"
      loading="lazy"
      fit="contain"
      opacity={loaded ? 1 : 0.5}
      onLoad={() => setLoaded(true)}
      onError={onError}
      style={{
        transition: 'opacity 0.5s ease',
      }}
      {...rest}
    />
  )
}
