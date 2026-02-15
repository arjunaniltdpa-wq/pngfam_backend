const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});

async function uploadToR2(key, buffer, type) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: type
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

module.exports = { uploadToR2 };
