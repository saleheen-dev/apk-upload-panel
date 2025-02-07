import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.B2_APPLICATION_KEY_ID) {
  throw new Error("Missing B2_APPLICATION_KEY_ID");
}

if (!process.env.B2_APPLICATION_KEY) {
  throw new Error("Missing B2_APPLICATION_KEY");
}

if (!process.env.B2_BUCKET_NAME) {
  throw new Error("Missing B2_BUCKET_NAME");
}

if (!process.env.AWS_ENDPOINT_URL) {
  throw new Error("Missing AWS_ENDPOINT_URL");
}

export const b2Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  region: process.env.AWS_BUCKET_REGION!,
});

export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME!;
