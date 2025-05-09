import { Image, ImageProps, PolymorphicComponentProps } from '@mantine/core'
import noImg from '@/assets/no-image.jpg'

export function Img({ ...rest }: PolymorphicComponentProps<'img', ImageProps>) {
  return (
    <Image
      {...rest}
      alt=""
      onError={e => {
        e.currentTarget.src = noImg.src
      }}
    />
  )
}
