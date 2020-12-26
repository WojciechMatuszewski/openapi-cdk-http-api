import { DocumentClient } from "aws-sdk/clients/dynamodb";
import type { SentimentType } from "aws-sdk/clients/comprehend";
import {
  SaveNotePayload,
  SaveNoteResult
} from "../../openapi/types/definitions";
import { NoteManager } from "../../lib/note";

const { TABLE_NAME } = process.env;

const db = new DocumentClient();

const noteManager = new NoteManager(db, TABLE_NAME as string);

type Event = SaveNotePayload & {
  id: string;
  sentiment: SentimentType;
};

const handler = async (event: Event): Promise<SaveNoteResult> => {
  const createdAt = new Date().toISOString();

  return noteManager.save({ ...event, createdAt });
};

export { handler };
