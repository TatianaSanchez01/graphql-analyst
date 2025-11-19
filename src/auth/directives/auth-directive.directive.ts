import { defaultFieldResolver, GraphQLFieldConfig } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

export function authDirectiveTransformer(schema, directiveName: string) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>) => {
      const authDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (authDirective) {
        const { requires } = authDirective;
        const originalResolver = fieldConfig.resolve || defaultFieldResolver;

        fieldConfig.resolve = async function (source, args, context, info) {
          const user = context.req.user;

          if (!user || !user.roles.includes(requires)) {
            throw new Error('No autorizado');
          }

          return originalResolver(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}
