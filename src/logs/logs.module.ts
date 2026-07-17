import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { LogsInterceptor } from './logs.interceptor';

@Module({
  controllers: [LogsController],
  providers: [
    LogsService,
    { provide: APP_INTERCEPTOR, useClass: LogsInterceptor },
  ],
})
export class LogsModule {}
