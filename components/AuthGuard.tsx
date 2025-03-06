import React from 'react';
import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import SkeletonLoader from './SkeletonLoader';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AdminDashboard: undefined;
};

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    if (!isLoading && requiredRole === 'admin' && !isAdmin) {
      navigation.goBack();
    }
  }, [user, isAdmin, isLoading, navigation, requiredRole]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SkeletonLoader />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};
