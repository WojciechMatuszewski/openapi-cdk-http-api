import Comprehend from "aws-sdk/clients/comprehend";
import { ulid } from "ulid";

const cph = new Comprehend();

type Event = {
  text: string;
};
const handler = async (event: Event) => {
  const result = await cph
    .detectSentiment({ LanguageCode: "en", Text: event.text })
    .promise();

  return {
    id: ulid(),
    text: event.text,
    sentiment: result.Sentiment
  };
};

export { handler };
