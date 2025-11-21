import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateListItemInput } from './dto/create-list-item.input';
import { UpdateListItemInput } from './dto/update-list-item.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ListItem } from './entities/list-item.entity';
import { Repository } from 'typeorm';
import { PaginationArgs, SearchArgs } from 'src/common/dto/args';
import { List } from 'src/lists/entities/list.entity';

@Injectable()
export class ListItemService {
  constructor(
    @InjectRepository(ListItem)
    private readonly listItemsRepository: Repository<ListItem>,
  ) {}

  async create(createListItemInput: CreateListItemInput): Promise<ListItem> {
    const { itemId, listId, ...rest } = createListItemInput;

    const newListItem = this.listItemsRepository.create({
      ...rest,
      item: { id: itemId },
      list: { id: listId },
    });

    await this.listItemsRepository.save(newListItem);

    return this.findOne(newListItem.id);
  }

  findAll(
    list: List,
    paginationArgs: PaginationArgs,
    searchArgs: SearchArgs,
  ): Promise<ListItem[]> {
    const { limit, offset } = paginationArgs;
    const { search } = searchArgs;
    const queryBuilder = this.listItemsRepository
      .createQueryBuilder('listItem')
      .where('listId = :listId', { listId: list.id })
      .take(limit)
      .skip(offset);

    if (search) {
      queryBuilder.andWhere('LOWER(name) like :name', {
        name: `%${search.toLowerCase()}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async countListItemsByList(list: List): Promise<number> {
    return this.listItemsRepository.count({
      where: { list: { id: list.id } },
    });
  }

  async findOne(id: string): Promise<ListItem> {
    const listItem = await this.listItemsRepository.findOneBy({ id });

    if (!listItem) {
      throw new NotFoundException(`ListItem with ID ${id} not found`);
    }

    return listItem;
  }

  async update(
    id: string,
    updateListItemInput: UpdateListItemInput,
  ): Promise<ListItem> {
    const { listId, itemId, ...rest } = updateListItemInput;

    const queryBuilder = this.listItemsRepository
      .createQueryBuilder('listItem')
      .where('listItem.id = :id', { id })
      .update()
      .set(rest);

      if (listId){
        queryBuilder.set({ ...rest, list: { id: listId } });
      }

      if (itemId){
        queryBuilder.set({ ...rest, item: { id: itemId } });
      }

    await queryBuilder.execute();

    return this.findOne(id);
  }

  remove(id: number) {
    return `This action removes a #${id} listItem`;
  }
}
