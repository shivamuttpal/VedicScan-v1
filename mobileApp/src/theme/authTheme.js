import { Platform } from 'react-native';

export const authTheme = {
  colors: {
    ivory: '#FFFDF8', cream: '#FFF8EC', champagne: '#F7E7C7',
    gold: '#C98A24', goldLight: '#F0C66D', amber: '#DF8B17', bronze: '#82511F',
    ink: '#33271F', body: '#655B52', muted: '#998D82', border: '#E9D2AC',
    white: '#FFFFFF', error: '#A94242', success: '#4F7B5D',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radii: { input: 20, button: 22, card: 24, round: 999 },
  type: {
    display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  },
  gradients: { primary: ['#F0A51D', '#D77B10', '#9C3B30'], surface: ['#FFFDF8', '#FFF7E9'] },
  shadow: {
    card: { shadowColor: '#7F5624', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 22, elevation: 4 },
    gold: { shadowColor: '#D4901B', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 6 },
  },
};
