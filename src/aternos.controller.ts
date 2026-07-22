import { Body, Controller, Post } from '@nestjs/common';
import { AExtensionController } from '@ivy-eco/sdk';
import { type ReceivedMessageEvent } from '@ivy-eco/sdk';
import { AternosService } from './aternos.service';

@Controller('minecraft')
export class AternosController extends AExtensionController<AternosService> {
    constructor(aternosS: AternosService) {
        super(aternosS);
    }

    @Post()
    async receiveMessage(@Body() body: ReceivedMessageEvent) {
        return this.handleData(body);
    }
}