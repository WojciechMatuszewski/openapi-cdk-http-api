import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetNoteResult } from "../../openapi/types/definitions";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NoteManager } from "../../lib/note";

const { TABLE_NAME } = process.env;

const db = new DocumentClient();

const noteManager = new NoteManager(db, TABLE_NAME as string);

const handler: APIGatewayProxyHandlerV2<GetNoteResult> = async event => {
  const { pathParameters = {} } = event;
  const { id } = pathParameters;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "bad request" })
    };
  }

  const retrievedNote = await noteManager.get(id);
  if (!retrievedNote) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "NOT FOUND!" })
    };
  }

  return retrievedNote;
};

export { handler };
