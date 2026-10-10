import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options';
import { DatabaseLifecycle } from './database.lifecycle';
@Global()
@Module({
  providers: [DatabaseLifecycle,{
    provide: DataSource,
    useFactory: async (): Promise<DataSource> => {
      const source = new DataSource(databaseOptions());
      return source.initialize();
    },
  }],
  exports: [DataSource],
})
export class DatabaseModule {}
