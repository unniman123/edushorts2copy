import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMemo } from 'react';
import { RootStackParamList } from '../screens/HomeScreen';

export const useNavigationCache = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  return useMemo(() => ({
    navigate: navigation.navigate,
    goBack: navigation.goBack,
  }), [navigation]);
};
