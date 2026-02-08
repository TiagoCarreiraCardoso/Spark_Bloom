import { createTheme, MantineColorsTuple } from '@mantine/core'

/**
 * Paleta Therapy With You (TWY) - do manual TWY_V8.pdf
 * Strong Blue #1D3668 = cor primária (confiança, serenidade)
 * Trust Blue #74BAD2 = acento secundário (claridade)
 * Peaceful Green #22B867 = sucesso
 * Warm Yellow #FFD226 = avisos
 * Energy Orange #FF6F17 = destaques
 * Compassion Pink #FFA4BD = toques suaves
 * Protective Purple #4637BF = variedade
 */

// Strong Blue #1D3668 – cor primária (escala Mantine 0=mais claro, 6=base, 9=mais escuro)
const twyStrongBlue: MantineColorsTuple = [
  '#eef1f7',
  '#d9dfec',
  '#b3bfde',
  '#8d9fcf',
  '#677fc1',
  '#415fb3',
  '#1d3668', // base TWY
  '#172b53',
  '#11203e',
  '#0b1629',
]

// Trust Blue – acento (botões, links, estados ativos)
const twyTrustBlue: MantineColorsTuple = [
  '#e8f5f9',
  '#d1ebf3',
  '#a3d7e7',
  '#74bad2', // base
  '#5aa8c4',
  '#4096b6',
  '#357a92',
  '#2a5e6e',
  '#1f424a',
  '#142626',
]

export const twyColors = {
  strongBlue: '#1D3668',
  protectivePurple: '#4637BF',
  energyOrange: '#FF6F17',
  warmYellow: '#FFD226',
  peacefulGreen: '#22B867',
  compassionPink: '#FFA4BD',
  trustBlue: '#74BAD2',
}

export const theme = createTheme({
  primaryColor: 'twy-blue',
  fontFamily: 'var(--font-nunito), Nunito, Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'var(--font-nunito), Nunito, Inter, system-ui, sans-serif',
  },
  colors: {
    'twy-blue': twyStrongBlue,
    'twy-trust': twyTrustBlue,
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        color: 'twy-blue',
      },
    },
  },
})
