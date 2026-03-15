import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { ItemVendorTermResponseDto } from './dto/item-vendor-term-response.dto';
import { SuppliersService } from './suppliers.service';

@Controller('items/:itemId/vendor-terms')
@Roles('admin', 'office')
export class ItemVendorTermsController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  listByItem(
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<ItemVendorTermResponseDto[]> {
    return this.suppliersService.listItemVendorTermsByItem(itemId);
  }
}
