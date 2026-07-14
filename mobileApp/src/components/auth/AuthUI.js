import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authTheme as T } from '../../theme/authTheme';

const ART = require('../../../assets/auth/celestial-lotus.png');

export const AuthScaffold = memo(({ children, compact = false }) => {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(enter, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [enter]);
  return <LinearGradient colors={T.gradients.surface} style={s.root}>
    <View pointerEvents="none" style={s.geometry}><View style={s.geometryInner} /></View>
    <View pointerEvents="none" style={s.glow} />
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingTop: insets.top + (compact ? 16 : 28), paddingBottom: insets.bottom + 32 }]}> 
        <Animated.View style={[s.content, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{children}</Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  </LinearGradient>;
});

export const LotusDivider = memo(() => <View style={s.divider}><View style={s.line} /><Text style={s.lotus}>♢</Text><View style={s.line} /></View>);

export const AuthHeader = memo(({ title, subtitle, illustration = false }) => <View style={s.header}>
  {illustration ? <Image source={ART} style={s.art} resizeMode="contain" /> : <View style={s.logoTile}><Text style={s.logoOm}>ॐ</Text></View>}
  <Text accessibilityRole="header" style={[s.brand, illustration && s.screenTitle]}>{title}</Text>
  <LotusDivider />
  <Text style={s.subtitle}>{subtitle}</Text>
</View>);

export const AuthInput = memo(({ label, icon, trailing, style, inputStyle, ...props }) => {
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={[s.inputWrap, style]}>
    {icon ? <View style={s.iconCircle}><Ionicons name={icon} size={18} color={T.colors.bronze} /></View> : null}
    <TextInput {...props} style={[s.input, inputStyle]} placeholderTextColor={T.colors.muted} selectionColor={T.colors.gold} underlineColorAndroid="transparent" />
    {trailing}
  </View></View>;
});

export const AuthPasswordInput = memo((props) => {
  const [visible, setVisible] = useState(false);
  return <AuthInput
    {...props}
    icon={props.icon || 'lock-closed-outline'}
    secureTextEntry={!visible}
    autoCapitalize="none"
    autoCorrect={false}
    textContentType={props.textContentType || 'password'}
    returnKeyType={props.returnKeyType || 'done'}
    trailing={<Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={12} onPress={() => setVisible((current) => !current)} style={s.eyeButton}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={T.colors.gold} />
    </Pressable>}
  />;
});

export const PrimaryButton = memo(({ title, loading, onPress, accessibilityLabel }) => <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} disabled={loading} onPress={onPress} style={({ pressed }) => [s.buttonPress, pressed && s.pressed, loading && s.disabled]}>
  <LinearGradient colors={T.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primary}><Text style={s.primaryText}>{loading ? 'Please wait…' : title}</Text><Ionicons name="arrow-forward" size={19} color="#FFF" /></LinearGradient>
</Pressable>);

export const SocialButton = memo(({ title, loading, onPress }) => <Pressable accessibilityRole="button" onPress={onPress} disabled={loading} style={({ pressed }) => [s.social, pressed && s.pressed]}><Text style={s.google}>G</Text><Text style={s.socialText}>{loading ? 'Connecting…' : title}</Text></Pressable>);

export const OrDivider = memo(() => <View style={s.or}><View style={s.line} /><Text style={s.orText}>or</Text><View style={s.line} /></View>);

export const PasswordStrength = memo(({ value }) => {
  const score = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  return <View style={s.strength}><View style={s.strengthRow}>{[0,1,2,3].map(i => <View key={i} style={[s.strengthBar, i < score && { backgroundColor: score < 3 ? T.colors.amber : T.colors.success }]} />)}</View><Text style={s.hint}>{value ? `${score < 2 ? 'Weak' : score < 4 ? 'Good' : 'Strong'} password` : 'Use 8+ characters'}</Text></View>;
});

export const AuthArt = ART;
export { T };

const s = StyleSheet.create({
  flex:{flex:1}, root:{flex:1,backgroundColor:T.colors.ivory}, scroll:{flexGrow:1,paddingHorizontal:24}, content:{width:'100%',maxWidth:480,alignSelf:'center'},
  geometry:{position:'absolute',width:300,height:300,borderRadius:150,borderWidth:1,borderColor:'rgba(201,138,36,.12)',right:-130,top:-90}, geometryInner:{margin:32,flex:1,borderRadius:140,borderWidth:1,borderColor:'rgba(201,138,36,.09)'}, glow:{position:'absolute',width:260,height:260,borderRadius:130,backgroundColor:'rgba(240,198,109,.10)',left:-120,top:180},
  header:{alignItems:'center',marginBottom:24}, logoTile:{width:68,height:68,borderRadius:20,backgroundColor:'#FFF8E8',borderWidth:1,borderColor:T.colors.goldLight,alignItems:'center',justifyContent:'center',...T.shadow.card}, logoOm:{fontSize:28,color:T.colors.gold}, brand:{marginTop:12,fontFamily:T.type.display,fontSize:38,fontWeight:'400',color:T.colors.ink,letterSpacing:-1}, screenTitle:{fontFamily:T.type.sans,fontSize:27,fontWeight:'600',letterSpacing:-.4}, subtitle:{fontSize:15,lineHeight:22,color:T.colors.body,textAlign:'center',maxWidth:360}, divider:{flexDirection:'row',alignItems:'center',marginVertical:9}, line:{height:StyleSheet.hairlineWidth,width:54,backgroundColor:T.colors.border}, lotus:{fontSize:16,color:T.colors.gold,marginHorizontal:8}, art:{width:116,height:116},
  field:{marginBottom:16}, label:{fontSize:14,fontWeight:'500',color:T.colors.ink,marginBottom:8,marginLeft:4}, inputWrap:{height:58,borderRadius:T.radii.input,borderWidth:1,borderColor:T.colors.border,backgroundColor:'#FFFEFB',flexDirection:'row',alignItems:'center',paddingHorizontal:12}, iconCircle:{width:36,height:36,borderRadius:18,backgroundColor:'#F9EDDA',alignItems:'center',justifyContent:'center',marginRight:10}, input:{flex:1,height:'100%',fontSize:15,color:T.colors.ink,paddingVertical:0,textAlignVertical:'center'}, eyeButton:{width:44,height:44,alignItems:'center',justifyContent:'center',marginRight:-8},
  buttonPress:{borderRadius:T.radii.button,overflow:'hidden',marginTop:8,...T.shadow.gold}, primary:{height:58,borderRadius:T.radii.button,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'center'}, primaryText:{color:'#FFF',fontSize:16,fontWeight:'600',letterSpacing:.2,marginRight:10}, pressed:{opacity:.88,transform:[{scale:.99}]}, disabled:{opacity:.65}, social:{height:58,borderRadius:T.radii.button,borderWidth:1,borderColor:T.colors.border,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center',justifyContent:'center',...T.shadow.card}, google:{fontSize:20,fontWeight:'600',color:'#4285F4',marginRight:12}, socialText:{fontSize:16,fontWeight:'500',color:T.colors.ink}, or:{flexDirection:'row',alignItems:'center',marginVertical:22}, orText:{marginHorizontal:14,fontSize:14,color:T.colors.bronze},
  strength:{marginTop:-8,marginBottom:16}, strengthRow:{flexDirection:'row',gap:6}, strengthBar:{height:3,flex:1,borderRadius:2,backgroundColor:'#EADFD2'}, hint:{fontSize:12,color:T.colors.muted,marginTop:6},
});
