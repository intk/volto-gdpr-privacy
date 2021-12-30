import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Button, Container } from 'semantic-ui-react';
import { Icon } from '@plone/volto/components';
import clearSVG from '@plone/volto/icons/clear.svg';

import cookiesConfig from '../../config/defaultPanelConfig.js';
import { updateGdprPrivacyConsent, displayBanner } from '../../actions';

import { loadPreferences } from '../../helpers/banner';
import { getLocaleConf, getCookiesKeys } from '../../helpers/config';

import CookieSettings from './CookieSettings';

import './cookieBanner.less';
import config from '@plone/volto/registry';

const messages = defineMessages({
  acceptTechnicalCookies: {
    id: 'volto-gdpr-privacy-acceptTechnicalCookiess',
    defaultMessage: 'Only necessary cookies',
  },
  acceptAllCookies: {
    id: 'volto-gdpr-privacy-acceptAllCookiess',
    defaultMessage: 'Accept all',
  },
  changeSettings: {
    id: 'volto-gdpr-privacy-changeSettings',
    defaultMessage: 'Change settings',
  },
  acceptSettings: {
    id: 'volto-gdpr-privacy-acceptSettings',
    defaultMessage: 'Accept',
  },
  close: {
    id: 'volto-gdpr-privacy-close',
    defaultMessage: 'Accept only necessary cookies and close',
  },
});

const CookieBanner = ({ display = false, cookies }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const profilingKeys = getCookiesKeys(cookiesConfig.profiling);
  const technicalKeys = getCookiesKeys(cookiesConfig.technical);

  const [preferences, setPreferences] = useState(
    loadPreferences(cookies, cookiesConfig),
  );

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (__SERVER__) {
      return;
    }

    //if user hasn't yet accepted cookies, or cookies_version is changed, ask user to accept new version
    if (
      !preferences.cookies_version ||
      cookiesConfig.last_updated !== preferences.cookies_version
    ) {
      setPreferences({ ...preferences, cookies_version: undefined });
      dispatch(displayBanner(true));
    }
  }, []);

  useEffect(() => {
    //on dispaly banner, remove cookie version
    if (display) {
      cookies.remove('cookies_version');
    }
  }, [display, cookies]);

  const update = (newPreferences) => {
    //set cookies
    Object.keys(newPreferences).forEach((k) =>
      cookies.set(k, newPreferences[k]),
    );

    setPreferences(newPreferences);
    dispatch(updateGdprPrivacyConsent(newPreferences));
    dispatch(displayBanner(false));
  };

  const acceptTechnicalCookies = () => {
    let newPreferences = { cookies_version: cookiesConfig.last_updated };
    technicalKeys.forEach((k) => {
      newPreferences[k] = true;
    });
    profilingKeys.forEach((k) => {
      cookies.set(k, false);
      newPreferences[k] = false;
    });

    update(newPreferences);
  };

  const acceptAllCookies = () => {
    let newPreferences = { cookies_version: cookiesConfig.last_updated };
    technicalKeys.forEach((k) => {
      newPreferences[k] = true;
    });
    profilingKeys.forEach((k) => {
      cookies.set(k, false);
      newPreferences[k] = true;
    });

    update(newPreferences);
  };

  const acceptSettings = () => {
    const newPreferences = {
      ...preferences,
      cookies_version: cookiesConfig.last_updated,
    };

    update(newPreferences);
  };

  const bannerText = getLocaleConf(cookiesConfig.text, config, intl.locale);

  return display ? (
    <div className="gdpr-privacy-banner">
      <div className="gdpr-privacy-content-wrapper">
        <Button
          basic
          icon
          onClick={(e) => {
            acceptTechnicalCookies();
          }}
          className="close-button"
        >
          <Icon
            name={clearSVG}
            className="circled"
            aria-label={intl.formatMessage(messages.close)}
            size="30px"
            title={intl.formatMessage(messages.close)}
          />
        </Button>
        <Container className="gdpr-privacy-content">
          <div className="title">{bannerText.title}</div>
          <div className="description">{bannerText.description}</div>

          {/********* SETTINGS *******/}
          {showSettings && (
            <CookieSettings
              preferences={preferences}
              setPreferences={setPreferences}
              cookiesConfig={cookiesConfig}
            />
          )}
          <div className="buttons">
            <Button
              color="black"
              onClick={(e) => {
                acceptTechnicalCookies();
              }}
            >
              {intl.formatMessage(messages.acceptTechnicalCookies)}
            </Button>

            {profilingKeys?.length > 0 && (
              <>
                <Button
                  className="primary"
                  onClick={(e) => {
                    acceptAllCookies();
                  }}
                >
                  {intl.formatMessage(messages.acceptAllCookies)}
                </Button>

                {!showSettings ? (
                  <Button
                    color="black"
                    onClick={(e) => {
                      setShowSettings(true);
                    }}
                  >
                    {intl.formatMessage(messages.changeSettings)}
                  </Button>
                ) : (
                  <Button
                    color="black"
                    onClick={(e) => {
                      acceptSettings();
                    }}
                  >
                    {intl.formatMessage(messages.acceptSettings)}
                  </Button>
                )}
              </>
            )}
          </div>
        </Container>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default CookieBanner;
