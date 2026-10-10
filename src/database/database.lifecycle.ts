import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Injectable()
export class DatabaseLifecycle implements OnModuleDestroy {
  constructor(private readonly source: DataSource) {}
  async onModuleDestroy(): Promise<void> {
    if (this.source.isInitialized) await this.source.destroy();
  }
}
