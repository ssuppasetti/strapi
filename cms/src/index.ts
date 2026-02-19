import type { Core } from '@strapi/strapi';

import { isPublishLifecycleEvent, publishEventToS3 } from './utils/publish-event-s3';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.db.lifecycles.subscribe({
      async afterCreate(event) {
        if (!isPublishLifecycleEvent(event)) return;

        try {
          await publishEventToS3({
            uid: event.model?.uid || 'unknown',
            id: (event.result?.id as string | number) || 'unknown',
            publishedAt: event.result?.publishedAt as string,
            action: event.action,
            occurredAt: new Date().toISOString(),
            data: event.result || {},
          });
        } catch (error) {
          strapi.log.error('[S3 Publish Hook] Failed to upload publish event afterCreate');
          strapi.log.error(error);
        }
      },

      async afterUpdate(event) {
        if (!isPublishLifecycleEvent(event)) return;

        try {
          await publishEventToS3({
            uid: event.model?.uid || 'unknown',
            id: (event.result?.id as string | number) || 'unknown',
            publishedAt: event.result?.publishedAt as string,
            action: event.action,
            occurredAt: new Date().toISOString(),
            data: event.result || {},
          });
        } catch (error) {
          strapi.log.error('[S3 Publish Hook] Failed to upload publish event afterUpdate');
          strapi.log.error(error);
        }
      },
    });
  },
};
