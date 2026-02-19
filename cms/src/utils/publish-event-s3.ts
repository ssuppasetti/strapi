import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

type PublishEventPayload = {
  uid: string;
  id: string | number;
  publishedAt: string;
  action: string;
  occurredAt: string;
  data: Record<string, unknown>;
};

let warnedMissingBucket = false;

const getBucketName = () => process.env.S3_PUBLISH_EVENTS_BUCKET;
const getPrefix = () => process.env.S3_PUBLISH_EVENTS_PREFIX || 'strapi-publish-events';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const publishEventToS3 = async (payload: PublishEventPayload) => {
  const bucket = getBucketName();

  if (!bucket) {
    if (!warnedMissingBucket) {
      warnedMissingBucket = true;
      console.warn('[S3 Publish Hook] S3_PUBLISH_EVENTS_BUCKET is not set. Publish events will not be uploaded.');
    }
    return;
  }

  const safeUid = payload.uid.replace(/[:.]/g, '_');
  const key = `${getPrefix()}/${safeUid}/${payload.id}-${Date.now()}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(payload, null, 2),
      ContentType: 'application/json',
    })
  );
};

export const isPublishLifecycleEvent = (event: {
  action: string;
  model?: { uid?: string };
  result?: Record<string, unknown>;
  params?: { data?: Record<string, unknown> };
}) => {
  const uid = event.model?.uid || '';
  if (!uid.startsWith('api::')) return false;

  if (event.action !== 'afterCreate' && event.action !== 'afterUpdate') return false;

  const publishedAt = event.result?.publishedAt;
  if (!publishedAt || typeof publishedAt !== 'string') return false;

  if (event.action === 'afterCreate') return true;

  const data = event.params?.data || {};
  const hasPublishedAtIntent =
    Object.prototype.hasOwnProperty.call(data, 'publishedAt') &&
    data.publishedAt !== null &&
    data.publishedAt !== undefined;

  const hasStatusPublishedIntent = data.status === 'published';

  return hasPublishedAtIntent || hasStatusPublishedIntent;
};
