import { MantineColor } from '@mantine/core'

export const HeaderHeight = 80
export const MainPadding = 20
export const ContentWidth = 1200

export const doujinshiTypesColor: Record<
  IDoujinshiData['types'],
  MantineColor
> = {
  doujinshi: 'blue',
  manga: 'orange',
  artistcg: 'violet',
  gamecg: 'green',
  imageset: 'grape',
  misc: 'pink',
}
