import type { Core } from '@strapi/strapi';

import { isPublishLifecycleEvent, publishEventToS3 } from './utils/publish-event-s3';

const ensureBootstrapSuperAdmin = async (strapi: Core.Strapi) => {
  const email = process.env.STRAPI_BOOTSTRAP_ADMIN_EMAIL || 'ssuppasetti@gmail.com';
  const password = process.env.STRAPI_BOOTSTRAP_ADMIN_PASSWORD || 'DontTell123';

  const existingUser = await strapi.db.query('admin::user').findOne({
    where: { email },
  });

  if (existingUser) {
    return;
  }

  const superAdminRole = await strapi.db.query('admin::role').findOne({
    where: { code: 'strapi-super-admin' },
  });

  if (!superAdminRole) {
    strapi.log.warn('[Bootstrap Admin] Super admin role not found. Skipping bootstrap admin creation.');
    return;
  }

  await strapi.admin.services.user.create({
    email,
    firstname: 'Super',
    lastname: 'Admin',
    password,
    isActive: true,
    blocked: false,
    roles: [superAdminRole.id],
  });

  strapi.log.info(`[Bootstrap Admin] Created super admin user: ${email}`);
};

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
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      await ensureBootstrapSuperAdmin(strapi);
    } catch (error) {
      strapi.log.error('[Bootstrap Admin] Failed to create bootstrap super admin user');
      strapi.log.error(error);
    }

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
