/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as admin from "../admin.js";
import type * as agents from "../agents.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as auth from "../auth.js";
import type * as chats from "../chats.js";
import type * as chats from "../chats.js";
import type * as documents from "../documents.js";
import type * as documents from "../documents.js";
import type * as env from "../env.js";
import type * as env from "../env.js";
import type * as files from "../files.js";
import type * as files from "../files.js";
import type * as healthCheck from "../healthCheck.js";
import type * as healthCheck from "../healthCheck.js";
import type * as memories from "../memories.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as messages from "../messages.js";
import type * as users from "../users.js";
import type * as users from "../users.js";
import type * as vectorStoreFiles from "../vectorStoreFiles.js";
import type * as vectorStoreFiles from "../vectorStoreFiles.js";
import type * as vectorStores from "../vectorStores.js";
import type * as vectorStores from "../vectorStores.js";
import type * as workflows from "../workflows.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  admin: typeof admin;
  agents: typeof agents;
  agents: typeof agents;
  auth: typeof auth;
  auth: typeof auth;
  chats: typeof chats;
  chats: typeof chats;
  documents: typeof documents;
  documents: typeof documents;
  env: typeof env;
  env: typeof env;
  files: typeof files;
  files: typeof files;
  healthCheck: typeof healthCheck;
  healthCheck: typeof healthCheck;
  memories: typeof memories;
  memories: typeof memories;
  messages: typeof messages;
  messages: typeof messages;
  users: typeof users;
  users: typeof users;
  vectorStoreFiles: typeof vectorStoreFiles;
  vectorStoreFiles: typeof vectorStoreFiles;
  vectorStores: typeof vectorStores;
  vectorStores: typeof vectorStores;
  workflows: typeof workflows;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
