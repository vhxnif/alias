import chalk, { type ChalkInstance } from "chalk"

const hex = (color: string): ChalkInstance => chalk.hex(color)

type ColorKey =
  | "rosewater"
  | "flamingo"
  | "pink"
  | "mauve"
  | "red"
  | "maroon"
  | "peach"
  | "yellow"
  | "green"
  | "teal"
  | "sky"
  | "sapphire"
  | "blue"
  | "lavender"
  | "subtext1"
  | "subtext0"
  | "overlay2"
  | "overlay1"
  | "overlay0"
  | "surface2"
  | "surface1"
  | "surface0"
  | "base"
  | "mantle"
  | "crust"

const colorHex: Record<ColorKey, string> = {
  rosewater: "#F5E0DC",
  flamingo: "#F2CDCD",
  pink: "#F5C2E7",
  mauve: "#CBA6F7",
  red: "#F38BA8",
  maroon: "#EBA0AC",
  peach: "#FAB387",
  yellow: "#F9E2AF",
  green: "#A6E3A1",
  teal: "#94E2D5",
  sky: "#89DCEB",
  sapphire: "#74C7EC",
  blue: "#89B4FA",
  lavender: "#B4BEFE",
  subtext1: "#BAC2DE",
  subtext0: "#A6ADC8",
  overlay2: "#9399B2",
  overlay1: "#7F849C",
  overlay0: "#6C7086",
  surface2: "#585B70",
  surface1: "#45475A",
  surface0: "#313244",
  base: "#1E1E2E",
  mantle: "#181825",
  crust: "#11111B",
}

function toColor(): Record<ColorKey, ChalkInstance> {
  return Object.keys(colorHex).reduce(
    (obj, it) => {
      const k = it as ColorKey
      obj[k] = hex(colorHex[k])
      return obj
    },
    {} as Record<ColorKey, ChalkInstance>,
  )
}

const color = toColor()

// ---- display ---- //
const display = {
  note: color.sky,
  important: color.pink,
  tip: color.green,
  success: color.green,
  caution: color.mauve,
  warning: color.peach,
  error: color.red,
  highlight: color.mauve,
}

function tableTitle(strs: string[]) {
  return strs.map((it) => color.green.bold(it))
}

export { colorHex, color, display, tableTitle, type ColorKey }
