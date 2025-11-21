import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { ItemsModule } from './items/items.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { authDirectiveTransformer } from './auth/directives/auth-directive.directive';
import { SeedModule } from './seed/seed.module';
import { CommonModule } from './common/common.module';
import { ListsModule } from './lists/lists.module';
import { ListItemModule } from './list-item/list-item.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [JwtService],
      useFactory: async (jwtService: JwtService) => ({
        playground: false,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        transformSchema: (schema) => {
          return authDirectiveTransformer(schema, 'auth');
        },
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        context({ req }) {
          // const token = req.headers.authorization?.replace('Bearer ', '');
          // if (!token) throw new Error('No token provided');

          // const payload = jwtService.decode(token);
          // if (!payload) throw new Error('Invalid token');
        },
      }),
    }),

    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   playground: false,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   plugins: [ApolloServerPluginLandingPageLocalDefault()],
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: true,
      autoLoadEntities: true,
    }),
    ItemsModule,
    UsersModule,
    AuthModule,
    SeedModule,
    CommonModule,
    ListsModule,
    ListItemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
