// import {
//   Box,
//   Image,
//   ImageProps,
//   PolymorphicComponentProps,
// } from '@mantine/core'
// import { useEffect, useRef, useState } from 'react'

// export function DoubleBufferImage({
//   src,
//   alt = '',
//   ...rest
// }: PolymorphicComponentProps<'img', ImageProps>) {
//   const [current, setCurrent] = useState<'a' | 'b'>('a')
//   const [loaded, setLoaded] = useState(false)
//   const imgARef = useRef<HTMLImageElement>(null)
//   const imgBRef = useRef<HTMLImageElement>(null)

//   useEffect(() => {
//     const nextImg = current === 'a' ? imgBRef.current : imgARef.current
//     if (!nextImg) return

//     setLoaded(false)
//     nextImg.src = src

//     nextImg.onload = () => {
//       setLoaded(true)
//       setCurrent(prev => (prev === 'a' ? 'b' : 'a'))
//     }

//     return () => {
//       nextImg.onload = null
//     }
//   }, [src])

//   return (
//     <Box pos="relative" h="1000px" w="100vw" bg="grape">
//       <Image
//         {...rest}
//         pos="absolute"
//         ref={imgARef}
//         alt={alt}
//         w="100%"
//         h="100%"
//         fit="contain"
//         opacity={current === 'a' && loaded ? 1 : 0}
//         style={{
//           inset: 0,
//           // transition: 'opacity 0.2s ease',
//         }}
//       />
//       <Image
//         pos="absolute"
//         {...rest}
//         ref={imgBRef}
//         alt={alt}
//         w="100%"
//         h="100%"
//         fit="contain"
//         opacity={current === 'b' && loaded ? 1 : 0}
//         style={{
//           inset: 0,
//           // transition: 'opacity 0.2s ease',
//         }}
//       />
//     </Box>
//   )
// }
