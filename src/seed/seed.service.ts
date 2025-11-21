import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from 'src/items/entities/item.entity';
import { ItemsService } from 'src/items/items.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

import { SEED_USERS, SEED_ITEMS, SEED_LISTS } from './data/seed-data';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { List } from 'src/lists/entities/list.entity';
import { ListsService } from 'src/lists/lists.service';
import { ListItemService } from 'src/list-item/list-item.service';

@Injectable()
export class SeedService {
  private isProd: boolean;
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(ListItem)
    private readonly listItemsRepository: Repository<ListItem>,

    @InjectRepository(List)
    private readonly listsRepository: Repository<List>,

    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly listsService: ListsService,
    private readonly listItemsService: ListItemService,
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

    const list = await this.loadLists(user);

    const items = await this.itemsService.findAll(
      user,
      { limit: 1, offset: 0 },
      {},
    );

    await this.loadListsItems(list, items);

    return true;
  }

  async deleteDatabase(): Promise<void> {
    //listItems
    await this.listItemsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

    // lists
    await this.listsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

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

  async loadLists(user: User): Promise<List> {
    const listsPromises: Promise<List>[] = [];

    for (const listData of SEED_LISTS) {
      listsPromises.push(this.listsService.create(listData, user));
    }

    return listsPromises[0];
  }

  async loadListsItems(list: List, items: Item[]): Promise<void> {
    for (const item of items) {
      this.listItemsService.create({
        quantity: Math.round(Math.random() * 10),
        completed: Math.round(Math.random() * 1) === 0 ? false : true,
        listId: list.id,
        itemId: item.id,
      });
    }
  }
}
