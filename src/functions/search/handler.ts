import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { SearchNotesResult } from "../../openapi/types/definitions";
import { NoteManager } from "../../lib/note";

const { TABLE_NAME } = process.env;

const db = new DocumentClient();

const noteManager = new NoteManager(db, TABLE_NAME as string);

const handler: APIGatewayProxyHandlerV2<SearchNotesResult> = async event => {
  const { queryStringParameters } = event;
  if (!queryStringParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Bad request" })
    };
  }

  const { query, cursor, limit = "25" } = queryStringParameters;
  return await noteManager.search({ query, cursor, limit });
};

export { handler };
