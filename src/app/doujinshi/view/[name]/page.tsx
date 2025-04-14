'use client'

import { useMainData } from '@/context/mainContext'
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Group,
  Image,
  Pill,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

export default function EditPage({ params }: { params: { name: string } }) {
  const [list, setList] = useState<string[]>([])

  const fetchImages = async () => {
    const res = await axios.post('/api/doujinshi_image', { name: decodeURIComponent(params.name) })
    setList(res.data.data)
    console.log(res)
  }

  useEffect(() => {
    fetchImages()
  }, [])

  return (
    <SimpleGrid cols={4}>
      {list.map((d, idx) => (
        <Image key={idx} src={d || noImg.src} alt={d} />
      ))}
    </SimpleGrid>
  )
}
