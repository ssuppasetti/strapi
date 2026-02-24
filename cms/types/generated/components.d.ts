import type { Schema, Struct } from '@strapi/strapi';

export interface SettingsForgotPassword extends Struct.ComponentSchema {
  collectionName: 'components_settings_forgot_password';
  info: {
    displayName: 'Forgot Password';
  };
  attributes: {
    emailEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    maxAttemptsPerHour: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 20;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
    smsEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tokenExpiryMinutes: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 120;
          min: 5;
        },
        number
      > &
      Schema.Attribute.DefaultTo<15>;
  };
}

export interface SettingsParentalControls extends Struct.ComponentSchema {
  collectionName: 'components_settings_parental_controls';
  info: {
    displayName: 'Parental Controls';
  };
  attributes: {
    enabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    kidProfileAutoLock: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    minAllowedMaturityRating: Schema.Attribute.Enumeration<
      ['G', 'PG', 'PG-13', 'R', 'NC-17']
    > &
      Schema.Attribute.DefaultTo<'PG-13'>;
    pinRequired: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface SettingsUserSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_user_settings';
  info: {
    displayName: 'User Settings';
  };
  attributes: {
    allowProfileTransfer: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    autoplayNextEpisode: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    autoplayPreviews: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    defaultLanguage: Schema.Attribute.Enumeration<
      ['en', 'es', 'fr', 'de', 'pt', 'hi']
    > &
      Schema.Attribute.DefaultTo<'en'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'settings.forgot-password': SettingsForgotPassword;
      'settings.parental-controls': SettingsParentalControls;
      'settings.user-settings': SettingsUserSettings;
    }
  }
}
