/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as blockchainTransactions from "../blockchainTransactions.js";
import type * as chats from "../chats.js";
import type * as documents from "../documents.js";
import type * as env from "../env.js";
import type * as files from "../files.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as migrations_fixBlacklistedTokens from "../migrations/fixBlacklistedTokens.js";
import type * as migrations_removeUpdatedAt from "../migrations/removeUpdatedAt.js";
import type * as migrations from "../migrations.js";
import type * as streaming from "../streaming.js";
import type * as subscriptions from "../subscriptions.js";
import type * as typing from "../typing.js";
import type * as users from "../users.js";
import type * as vectorStoreFiles from "../vectorStoreFiles.js";
import type * as vectorStores from "../vectorStores.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  adminAuth: typeof adminAuth;
  agents: typeof agents;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  blockchainTransactions: typeof blockchainTransactions;
  chats: typeof chats;
  documents: typeof documents;
  env: typeof env;
  files: typeof files;
  healthCheck: typeof healthCheck;
  http: typeof http;
  memories: typeof memories;
  messages: typeof messages;
  "migrations/fixBlacklistedTokens": typeof migrations_fixBlacklistedTokens;
  "migrations/removeUpdatedAt": typeof migrations_removeUpdatedAt;
  migrations: typeof migrations;
  streaming: typeof streaming;
  subscriptions: typeof subscriptions;
  typing: typeof typing;
  users: typeof users;
  vectorStoreFiles: typeof vectorStoreFiles;
  vectorStores: typeof vectorStores;
  workflows: typeof workflows;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  persistentTextStreaming: {
    lib: {
      addChunk: FunctionReference<
        "mutation",
        "internal",
        { final: boolean; streamId: string; text: string },
        any
      >;
      createStream: FunctionReference<"mutation", "internal", {}, any>;
      getStreamStatus: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        "pending" | "streaming" | "done" | "error" | "timeout"
      >;
      getStreamText: FunctionReference<
        "query",
        "internal",
        { streamId: string },
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          text: string;
        }
      >;
      setStreamStatus: FunctionReference<
        "mutation",
        "internal",
        {
          status: "pending" | "streaming" | "done" | "error" | "timeout";
          streamId: string;
        },
        any
      >;
    };
  };
};
