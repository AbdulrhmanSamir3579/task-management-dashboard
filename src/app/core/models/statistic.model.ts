export type ChangeType = 'positive' | 'negative' | 'neutral';

/** One dashboard card. Same shape as `statistics.json` in DATA_README.md. */
export interface Statistic {
  id: string;
  title: string;
  icon: string;
  value: number;
  change: string;
  changeLabel: string;
  changeType: ChangeType;
  color: string;
}
