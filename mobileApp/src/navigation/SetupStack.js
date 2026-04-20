import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileWizardScreen from '../screens/setup/ProfileWizardScreen';

const Stack = createNativeStackNavigator();

const SetupStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="ProfileWizard" component={ProfileWizardScreen} />
  </Stack.Navigator>
);

export default SetupStack;
