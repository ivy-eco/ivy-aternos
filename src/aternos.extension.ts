import { Module } from "@nestjs/common";
import { AternosService } from "./aternos.service";
import { AternosController } from "./aternos.controller";

@Module({
    imports: [],
    providers: [AternosService],
    exports: [AternosService],
    controllers: [AternosController]
})
export class AternosExtension {}