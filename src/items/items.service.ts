import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {
    // Assuming ItemsRepository is defined and injected properly
  }

  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    const newItem = this.itemsRepository.create(createItemInput);
    newItem.user = user;
    return await this.itemsRepository.save(newItem);
  }

  async findAll(
    user: User,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<Item[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;

    const queryBuilder = this.itemsRepository.createQueryBuilder('item')
      .take(limit)
      .skip(offset)
      .where('item.userId = :userId', { userId: user.id });

    if (search) {
      queryBuilder.andWhere('LOWER(item.name) ILIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<Item> {
    const item = await this.itemsRepository.findOneBy({
      id,
      user: { id: user.id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    updateItemInput: UpdateItemInput,
    user: User,
  ): Promise<Item> {
    await this.findOne(id, user);

    const item = await this.itemsRepository.preload({
      ...updateItemInput,
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return this.itemsRepository.save(item);
  }

  async remove(id: string, user: User): Promise<Item> {
    const item = await this.findOne(id, user);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    await this.itemsRepository.remove(item);

    return { ...item };
  }

  async itemCountByUser(user: User): Promise<number> {
    return this.itemsRepository.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });
  }
}
