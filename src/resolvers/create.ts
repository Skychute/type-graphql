import { GraphQLFieldResolver } from "graphql";

import { IOCContainer } from "../utils/container";
import {
  FieldResolverMetadata,
  FieldMetadata,
  BaseResolverMetadata,
} from "../metadata/definitions";
import { getParams, checkForAccess } from "./helpers";
import { convertToType } from "../helpers/types";
import { BuildContext } from "../schema/build-context";
import { ActionData } from "../types";

export function createHandlerResolver(
  resolverMetadata: BaseResolverMetadata,
): GraphQLFieldResolver<any, any, any> {
  const targetInstance = IOCContainer.getInstance(resolverMetadata.target);
  const { validate: globalValidate, authChecker, pubSub } = BuildContext;

  return async (root, args, context, info) => {
    const actionData: ActionData = { root, args, context, info };
    try {
      await checkForAccess(actionData, authChecker, resolverMetadata.roles);
    } catch (err) {
      return null;
    }
    const params: any[] = await getParams(
      resolverMetadata.params!,
      actionData,
      globalValidate,
      pubSub,
    );
    return resolverMetadata.handler!.apply(targetInstance, params);
  };
}

export function createAdvancedFieldResolver(
  fieldResolverMetadata: FieldResolverMetadata,
): GraphQLFieldResolver<any, any, any> {
  if (fieldResolverMetadata.kind === "external") {
    return createHandlerResolver(fieldResolverMetadata);
  }

  const targetType = fieldResolverMetadata.getParentType!();
  const { validate: globalValidate, authChecker, pubSub } = BuildContext;

  return async (root, args, context, info) => {
    const actionData: ActionData = { root, args, context, info };
    try {
      await checkForAccess(actionData, authChecker, fieldResolverMetadata.roles);
    } catch (err) {
      return null;
    }
    const targetInstance: any = convertToType(targetType, root);
    // method
    if (fieldResolverMetadata.handler) {
      const params: any[] = await getParams(
        fieldResolverMetadata.params!,
        actionData,
        globalValidate,
        pubSub,
      );
      return fieldResolverMetadata.handler.apply(targetInstance, params);
    }
    // getter
    return targetInstance[fieldResolverMetadata.methodName];
  };
}

export function createSimpleFieldResolver(
  fieldMetadata: FieldMetadata,
): GraphQLFieldResolver<any, any, any> {
  const authChecker = BuildContext.authChecker;
  return async (root, args, context, info) => {
    const actionData: ActionData = { root, args, context, info };
    try {
      await checkForAccess(actionData, authChecker, fieldMetadata.roles);
    } catch (err) {
      return null;
    }
    return root[fieldMetadata.name];
  };
}
