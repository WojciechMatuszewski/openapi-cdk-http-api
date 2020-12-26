import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ListNotesResult } from "../../openapi/types/definitions";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NoteManager } from "../../lib/note";

const { TABLE_NAME } = process.env;

const db = new DocumentClient();

const noteManager = new NoteManager(db, TABLE_NAME as string);

const handler: APIGatewayProxyHandlerV2<ListNotesResult> = async event => {
  const { queryStringParameters = {} } = event;
  const { cursor, limit = "25" } = queryStringParameters;

  return await noteManager.list({ cursor, limit });
};

export { handler };
