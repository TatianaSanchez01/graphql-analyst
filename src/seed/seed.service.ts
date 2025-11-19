import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { ItemsService } from 'src/items/items.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

import { SEED_USERS, SEED_ITEMS } from './data/seed-data';

@Injectable()
export class SeedService {
  private isProd: boolean;
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
  ) {
    this.isProd = this.configService.get('STATE') === 'prod';
  }

  async executeSeed(): Promise<boolean> {
    if (this.isProd) {
      throw new Error(
        'Seed execution is not allowed in production environment',
      );
    }

    // Limpiar la base de datos BORRAR TODO
    await this.deleteDatabase();

    // Crear usuarios
    const user = await this.loadUsers();

    // Crear items
    await this.loadItems(user);

    return true;
  }

  async deleteDatabase(): Promise<void> {
    // borrar items
    await this.itemsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

    // borrar users
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();
  }

  async loadUsers(): Promise<User> {
    const users: User[] = [];

    for (const user of SEED_USERS) {
      users.push(await this.usersService.create(user));
    }

    return users[0];
  }

  async loadItems(user: User): Promise<void> {
    const itemsPromises: Promise<Item>[] = [];

    for (const item of SEED_ITEMS) {
      // normalize null quantityUnits to undefined to match CreateItemInput type
      const createItemInput = {
        ...item,
        quantityUnits: item.quantityUnits ?? undefined,
      };
      itemsPromises.push(this.itemsService.create(createItemInput, user));
    }

    await Promise.all(itemsPromises);
  }
}
