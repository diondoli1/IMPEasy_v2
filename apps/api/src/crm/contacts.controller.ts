import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';

@Controller()
@Roles('admin', 'office')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('customers/:customerId/contacts')
  listByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<ContactResponseDto[]> {
    return this.contactsService.listByCustomer(customerId);
  }

  @Get('contacts/:id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ContactResponseDto> {
    return this.contactsService.findOne(id);
  }

  @Post('customers/:customerId/contacts')
  create(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() payload: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.create(customerId, payload);
  }

  @Patch('contacts/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.update(id, payload);
  }
}
