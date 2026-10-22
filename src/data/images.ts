const px = (id: string, w = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const images = {
  heroHoney: px('11771949'),
  heroLandscape: px('710263'),
  honeySpoonsDark: px('18878003'),
  honeyDripDark: px('15926833'),
  honeycombDark: px('8851478'),
  honeycomb: px('20012002'),
  beekeeper: px('8105625'),
  beekeeperField: px('36813218'),
  beesOnComb: px('3194327'),
  manukaFlower: px('8337718'),
  manukaPink: px('6187185'),
  breakfast: px('19573135'),
  breakfastTable: px('14407470'),
  woman: px('8845105', 1000),
  tea: px('31684292', 1000),
  gingerTea: px('8704811'),
  nzHills: px('27307156'),
  nzLake: px('9498628'),
  nzCoast: px('25772460'),
  jarsTray: px('9105966'),
  jarsPlate: px('5865194', 1000),
};
