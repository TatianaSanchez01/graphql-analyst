import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'items' })
@ObjectType()
export class Item {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field(() => String)
  name: string;

  // @Column()
  // @Field(() => Float)
  // quantity: number;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  quantityUnits?: string; // g, ml, kg, tsp, cup, unit, etc.

  // Users
  @ManyToOne(() => User, (user) => user.items, { nullable: false, lazy: true })
  @Index('userId-index')
  @Field(() => User)
  @Directive(`@auth(requires: [${ValidRoles.admin}, ${ValidRoles.user}])`)
  user: User;

  
  @OneToMany(() => ListItem, (listItem) => listItem.item, { lazy: true })
  @Field( () => [ListItem] )
  listItem: ListItem[]
}
