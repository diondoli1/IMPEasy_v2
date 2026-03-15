export type ModuleDashboardCard = {
  key: string;
  label: string;
  value: number;
  hint: string;
  href: string | null;
};

export type ModuleDashboardResponse = {
  module: string;
  cards: ModuleDashboardCard[];
  generatedAt: string;
};
