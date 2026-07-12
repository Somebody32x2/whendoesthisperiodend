// Bar colors. Hex values are used inline (style attributes) so Tailwind's
// content scanner never purges them and admin-configured colors always render.
export const BAR_COLORS = {
    blue: "#228be6",
    violet: "#7950f2",
    red: "#fa5252",
    orange: "#fd7e14",
    green: "#40c057",
    yellow: "#fab005",
    lime: "#82c91e",
    indigo: "#4c6ef5",
    cyan: "#15aabf",
    teal: "#12b886",
    pink: "#e64980",
    grape: "#be4bdb",
    gray: "#868e96"
} as const;

export type BarColor = keyof typeof BAR_COLORS;
export const BAR_COLOR_NAMES = Object.keys(BAR_COLORS) as BarColor[];
