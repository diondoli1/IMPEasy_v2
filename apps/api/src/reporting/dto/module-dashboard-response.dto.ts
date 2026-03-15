import { ModuleDashboardCardDto } from './module-dashboard-card.dto';

export class ModuleDashboardResponseDto {
  module!: string;
  cards!: ModuleDashboardCardDto[];
  generatedAt!: Date;
}
