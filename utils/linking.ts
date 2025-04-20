import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types/navigation';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'edushort://', // Custom URL scheme
    'https://edushorts.app', // Production domain
    'http://edushorts.app' // Development
  ],
  config: {
    screens: {
      Main: {
        path: '',
        screens: {
          HomeTab: 'home',
          DiscoverTab: 'discover',
          BookmarksTab: 'bookmarks',
          ProfileTab: 'profile'
        }
      },
      ArticleDetail: {
        path: 'article/:articleId',
        parse: {
          articleId: (id: string) => id
        }
      },
      Login: {
        path: 'login',
        parse: {
          emailConfirmed: (value: string) => value === 'true',
          pendingConfirmation: (value: string) => value === 'true'
        }
      },
      Register: 'register',
      EmailConfirmation: {
        path: 'confirm-email/:token?',
        parse: {
          token: (token: string) => token,
          email: (email: string) => email
        }
      },
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token
        }
      },
      Settings: 'settings',
      Notifications: 'notifications'
    }
  },
  async getInitialURL() {
    // First, check if the app was opened via a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    return null;
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);

    // Listen to incoming deep links when the app is running
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};

export default linking;
