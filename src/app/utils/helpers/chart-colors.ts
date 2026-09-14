export interface IChartColor {
  background: string;
  border: string;
}

export interface IRankingColor extends IChartColor {}

// RANKING
export const RANKING_COLORS = {
  gold: {
    background: 'rgba(255, 215, 0, 0.75)',
    border: 'rgb(218, 165, 32)',
  },
  silver: {
    background: 'rgba(192, 192, 192, 0.75)',
    border: 'rgb(128, 128, 128)',
  },
  bronze: {
    background: 'rgba(205, 127, 50, 0.75)',
    border: 'rgb(166, 88, 32)',
  },
  neutral: {
    background: 'rgba(0, 0, 0, 0.62)',
    border: 'rgba(128, 128, 128, 0.5)',
  },
} satisfies Record<string, IRankingColor>;

export const getRankingColors = (values: number[]): { background: string[]; border: string[] } => {
  const rankedValues = [...new Set(values)];

  const colors = values.map(value => {
    const rank = rankedValues.indexOf(value);

    if (rank === 0) {
      return RANKING_COLORS.gold;
    }

    if (rank === 1) {
      return RANKING_COLORS.silver;
    }

    if (rank === 2) {
      return RANKING_COLORS.bronze;
    }

    return RANKING_COLORS.neutral;
  });

  return {
    background: colors.map(color => color.background),
    border: colors.map(color => color.border),
  };
};

// CONTINENTS
export const CONTINENT_COLORS = {
  america: {
    background: 'rgba(53, 164, 249, 0.7)',
    border: 'rgb(86, 213, 255)',
  },
  europe: {
    background: 'rgba(246, 77, 77, 0.7)',
    border: 'rgb(248, 114, 114)',
  },
  africa: {
    background: 'rgba(75, 192, 93, 0.7)',
    border: 'rgb(147, 213, 145)',
  },
  asia: {
    background: 'rgba(255, 207, 96, 0.7)',
    border: 'rgb(209, 224, 110)',
  },
  oceania: {
    background: 'rgba(128, 96, 255, 0.7)',
    border: 'rgb(181, 153, 241)',
  },
} satisfies Record<string, IChartColor>;

// GENDER
export const GENDER_COLORS = {
  female: {
    background: 'rgba(255, 99, 132, 0.5)',
    border: 'rgb(255, 99, 132)',
  },
  male: {
    background: 'rgba(54, 162, 235, 0.5)',
    border: 'rgb(54, 162, 235)',
  },

  gay: {
    background: 'rgba(255, 205, 86, 0.5)',
    border: 'rgb(255, 205, 86)',
  },
  trans: {
    background: 'rgba(153, 102, 255, 0.5)',
    border: 'rgb(153, 102, 255)',
  },
} satisfies Record<string, IChartColor>;

export const getGenderColor = (gender: string): string => {
  return GENDER_COLORS[gender.toLowerCase() as keyof typeof GENDER_COLORS]?.border ?? 'rgb(128, 128, 128)';
};
