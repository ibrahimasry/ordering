import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: 'db',
        port: configService.getOrThrow('POSTGRES_PORT'),
        database: configService.getOrThrow('POSTGRES_DATABASE'),
        username: configService.getOrThrow('POSTGRES_USERNAME'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  static forFeature(models: EntityClassOrSchema[]) {
    return TypeOrmModule.forFeature(models);
  }
}
