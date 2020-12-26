import type { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ApiTypes } from "../openapi/types/api-types";
import { Note, SearchNotesResult } from "../openapi/types/definitions";

export class NoteManager {
  #db: DocumentClient;
  #tableName: string;

  constructor(db: DocumentClient, tableName: string) {
    this.#db = db;
    this.#tableName = tableName;
  }

  public async get(id: string): Promise<Note | undefined> {
    const getResult = await this.#db
      .get({
        TableName: this.#tableName,
        Key: {
          pk: "NOTE",
          sk: `NOTE#${id}`
        }
      })
      .promise();

    if (!getResult.Item) {
      return undefined;
    }

    return this.toNote(getResult.Item as NoteItem);
  }

  public async save(note: Note): Promise<Note> {
    await this.#db
      .put({
        TableName: this.#tableName,
        Item: this.toItem(note)
      })
      .promise();

    return note;
  }

  public async search({
    query,
    limit,
    cursor
  }: ApiTypes["SearchNote"]["parameters"]["query"]): Promise<SearchNotesResult> {
    const queryResult = await this.#db
      .query({
        TableName: this.#tableName,
        IndexName: "byText",
        KeyConditionExpression: "#pk = :pk AND begins_with(#text, :query)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#text": "text"
        },
        ExpressionAttributeValues: {
          ":pk": "NOTE",
          ":query": query
        },
        ExclusiveStartKey: this.keyFromCursor(cursor),
        Limit: Number(limit)
      })
      .promise();

    const notes = (queryResult.Items || []) as NoteItem[];
    const normalizedNotes = notes.map(this.toNote.bind(this));

    const result: SearchNotesResult = {
      cursor: this.cursorFromKey(queryResult.LastEvaluatedKey),
      notes: normalizedNotes
    };
    return result;
  }

  public async list({
    limit,
    cursor
  }: ApiTypes["ListNotes"]["parameters"]["query"]): Promise<SearchNotesResult> {
    const queryResult = await this.#db
      .query({
        TableName: this.#tableName,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :skPrefix)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk"
        },
        ExpressionAttributeValues: {
          ":pk": "NOTE",
          ":skPrefix": "NOTE"
        },
        ExclusiveStartKey: this.keyFromCursor(cursor),
        Limit: Number(limit),
        ScanIndexForward: false
      })
      .promise();

    const notes = (queryResult.Items || []) as NoteItem[];
    const normalizedNotes = notes.map(this.toNote.bind(this));

    const result: SearchNotesResult = {
      cursor: this.cursorFromKey(queryResult.LastEvaluatedKey),
      notes: normalizedNotes
    };
    return result;
  }

  private toNote(item: NoteItem): Note {
    const id = item.sk.replace("NOTE#", "");
    return {
      id,
      createdAt: item.createdAt,
      sentiment: item.sentiment,
      text: item.text.replace(`#${id}`, "")
    };
  }

  private toItem(note: Note): NoteItem {
    return {
      pk: "NOTE",
      createdAt: note.createdAt,
      sentiment: note.sentiment,
      sk: `NOTE#${note.id}`,
      text: `${note.text}#${note.id}`
    } as const;
  }

  private keyFromCursor(cursor?: string) {
    if (!cursor) return;

    const unescaped = decodeURI(cursor);

    return JSON.parse(Buffer.from(unescaped, "base64").toString("utf-8"));
  }

  private cursorFromKey(key?: DocumentClient.Key) {
    if (!key) return undefined;

    const json = JSON.stringify(key);
    const unescaped = Buffer.from(json, "utf8").toString("base64");

    return encodeURI(unescaped);
  }
}

type NoteItem = {
  pk: "NOTE";
  sk: `NOTE#${string}`;
  text: `${string}#${string}`;
  createdAt: string;
  sentiment: string;
};
