export interface IChartColor {
  background: string;
  border: string;
}

export const CHART_NEUTRAL_COLOR = 'rgba(100, 100, 100, 0.5)';
export const CHART_UNKNOWN_COLOR = 'rgb(128, 128, 128)';

export interface IRankingColor extends IChartColor {}

// HELPERS
const rgba = (r: number, g: number, b: number, alpha: number): string => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const rgb = (r: number, g: number, b: number): string => `rgb(${r}, ${g}, ${b})`;

const createColor = (r: number, g: number, b: number, alpha = 0.5): IChartColor => ({
  background: rgba(r, g, b, alpha),
  border: rgb(r, g, b),
});

export const getColorWithOpacity = (color: IChartColor, alpha?: number): string => {
  // Use the original background when no custom opacity is provided.
  if (alpha === undefined) {
    return color.background;
  }

  const match = color.border.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);

  if (!match) {
    return color.background;
  }

  const [, r, g, b] = match;

  return rgba(Number(r), Number(g), Number(b), alpha);
};

// GENERAL COLORS
// RANKING
export const RANKING_COLORS = {
  gold: {
    background: rgba(255, 215, 0, 0.2),
    border: rgb(218, 165, 32),
  },
  silver: {
    background: rgba(192, 192, 192, 0.2),
    border: rgb(128, 128, 128),
  },
  bronze: {
    background: rgba(205, 127, 50, 0.2),
    border: rgb(166, 88, 32),
  },
  neutral: {
    background: rgba(0, 0, 0, 0.2),
    border: rgb(0, 0, 0),
  },
} satisfies Record<string, IRankingColor>;

export const getRankingColors = (values: number[]): { background: string[]; border: string[] } => {
  const rankedValues = [...new Set(values)];

  const colors = values.map(value => {
    const rank = rankedValues.indexOf(value);

    if (rank === 0) return RANKING_COLORS.gold;
    if (rank === 1) return RANKING_COLORS.silver;
    if (rank === 2) return RANKING_COLORS.bronze;

    return RANKING_COLORS.neutral;
  });

  return {
    background: colors.map(color => color.background),
    border: colors.map(color => color.border),
  };
};

// CONTINENTS
export const CONTINENT_COLORS = {
  america: createColor(53, 164, 249, 0.2),
  europe: createColor(246, 77, 77, 0.2),
  africa: createColor(75, 192, 93, 0.2),
  asia: createColor(255, 207, 96, 0.2),
  oceania: createColor(128, 96, 255, 0.2),
} satisfies Record<string, IChartColor>;

// GENDER
export const GENDER_COLORS = {
  female: createColor(255, 99, 132, 0.2),
  male: createColor(54, 162, 235, 0.2),
  gay: createColor(255, 205, 86, 0.2),
  trans: createColor(153, 102, 255, 0.2),
} satisfies Record<string, IChartColor>;

export const getGenderColor = (gender: string): string => GENDER_COLORS[gender.toLowerCase() as keyof typeof GENDER_COLORS]?.border ?? CHART_UNKNOWN_COLOR;

// GROUPS
export const GROUP_COLORS = {
  Couple: createColor(255, 99, 132, 0.2),
  Friends: createColor(75, 192, 192, 0.2),
  Family: createColor(255, 193, 7, 0.2),
} satisfies Record<string, IChartColor>;

// CHARTS
// SUMMARY
export const SUMMARY_COLORS = {
  radarPoints: {
    general: {
      background: 'rgb(230, 99, 127)',
      border: 'rgb(204, 0, 44)',
    },
    solo: {
      background: 'rgb(58, 98, 219)',
      border: 'rgb(0, 19, 127)',
    },
    groups: {
      background: 'rgb(154, 230, 159)',
      border: 'rgb(0, 82, 35)',
    },
  },
} as const;

// GIFTS
export const GIFTS_COLORS: IChartColor[] = [
  createColor(255, 99, 132, 0.2),
  createColor(255, 159, 64, 0.2),
  createColor(255, 205, 86, 0.2),
  createColor(75, 192, 192, 0.2),
  createColor(54, 162, 235, 0.2),
  createColor(153, 102, 255, 0.2),
  createColor(201, 203, 207, 0.2),
];

// RATINGS
export const RATINGS_COLORS: IChartColor[] = [
  createColor(255, 99, 132, 0.2),
  createColor(255, 159, 64, 0.2),
  createColor(255, 205, 86, 0.2),
  createColor(75, 192, 192, 0.2),
  createColor(54, 162, 235, 0.2),
  createColor(153, 102, 255, 0.2),
];

export const RATING_DOT_COLORS = {
  highest: createColor(75, 192, 75, 0.2),
  lowest: {
    background: 'rgb(228, 20, 65)',
    border: 'rgb(238, 40, 83)',
  },
} satisfies Record<string, IChartColor>;

// TIMELINE
export const TIMELINE_COLORS = {
  sameStay: {
    background: 'rgba(75, 192, 192, 0.5)',
    border: 'rgb(75, 192, 192)',
    edges: 'rgba(75, 192, 192, 0.4)',
  },
} as const;

// STAYS
export const STAYS_COLORS = {
  maxPeopleTogether: [createColor(54, 162, 235, 0.2), createColor(153, 102, 255, 0.2)],
  networkEdges: CHART_NEUTRAL_COLOR,
} as const;

// BIRTHDAYS
export const BIRTHDAYS_COLORS = {
  repeated: {
    ...createColor(102, 204, 255, 0.2),
    border: rgb(102, 222, 255),
  },
  unusual: {
    ...createColor(37, 162, 83, 0.2),
    border: rgb(48, 159, 37),
  },
  calendar: {
    empty: rgba(238, 238, 238, 0),
    one: rgba(153, 102, 255, 0.2),
    two: rgba(153, 102, 255, 0.4),
    many: rgba(153, 102, 255, 0.7),
    border: rgb(113, 112, 112),
  },
} as const;
