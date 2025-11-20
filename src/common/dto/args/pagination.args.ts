import { Args, ArgsType, Field, Int } from "@nestjs/graphql";
import { IsOptional, Min } from "class-validator";

@ArgsType()
export class PaginationArgs {

    @Field(() => Int, { defaultValue: 0, nullable: true, description: 'Number of items to skip' })
    @Min(0)
    @IsOptional()
    offset: number = 0;


    @Field(() => Int, { defaultValue: 10, nullable: true, description: 'Maximum number of items to return' })
    @Min(1)
    @IsOptional()
    limit: number = 10;


}