import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/lib/admin";
import { parseBody } from "@/lib/validations";

/**
 * Presigned R2 upload URL (section 7.4): short lived (15 min),
 * image content-type whitelist, the server never receives the file.
 */
const bodySchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

function r2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  const guard = await adminGuard();
  if (!guard.ok) return guard.response;

  const parsed = await parseBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { filename, contentType } = parsed.data;

  const safe = filename.replace(/[^\w.-]/g, "_").slice(-100);
  const key = `formats/refs/${Date.now()}-${safe}`;

  const url = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: undefined,
    }),
    { expiresIn: 15 * 60 },
  );

  return NextResponse.json({ url, key });
}
