// Nearest stars to the Sun
export const nearestStars = [
  'Proxima Centauri',
  'Alpha Centauri A',
  'Alpha Centauri B',
  'Barnard\'s Star',
  'Wolf 359',
  'Lalande 21185',
  'Sirius A',
  'Sirius B',
  'Luyten 726-8 A',
  'Luyten 726-8 B',
  'Ross 154',
  'Ross 248',
  'Epsilon Eridani',
  'Lacaille 9352',
  'Ross 128',
  'EZ Aquarii A',
  'EZ Aquarii B',
  'EZ Aquarii C',
  'Procyon A',
  'Procyon B',
  '61 Cygni A',
  '61 Cygni B',
  'Struve 2398 A',
  'Struve 2398 B',
  'Groombridge 34 A',
  'Groombridge 34 B',
  'DX Cancri',
  'Tau Ceti',
  'Luyten\'s Star',
  'Kapteyn\'s Star'
]

// Function to get a random star name
export const getRandomStar = () => {
  return nearestStars[Math.floor(Math.random() * nearestStars.length)]
}

