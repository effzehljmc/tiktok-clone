import { useState } from 'react'
import { Alert, StyleSheet, View, Text } from 'react-native'
import { Button, Input } from '@rneui/themed'
import { router } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  async function signInWithEmail() {
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid login credentials. Please check your email and password.',
        [{ text: 'OK' }]
      )
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#FFFFFF' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          inputStyle={styles.input}
          labelStyle={styles.label}
          placeholderTextColor="#666666"
          inputContainerStyle={styles.inputContainer}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock', color: '#FFFFFF' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          inputStyle={styles.input}
          labelStyle={styles.label}
          placeholderTextColor="#666666"
          inputContainerStyle={styles.inputContainer}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title={loading ? "Signing in..." : "Sign In"} 
          disabled={loading} 
          onPress={signInWithEmail}
          buttonStyle={styles.button}
          titleStyle={styles.buttonText}
          disabledStyle={styles.buttonDisabled}
        />
      </View>
      <Button 
        type="clear" 
        title="Don't have an account? Sign Up" 
        onPress={() => router.push('/signup')}
        titleStyle={styles.linkText}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  inputContainer: {
    borderBottomColor: '#333333',
    borderBottomWidth: 1,
  },
  button: {
    backgroundColor: '#FF0050',
    borderRadius: 8,
    height: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#333333',
  },
  linkText: {
    color: '#FF0050',
    fontSize: 14,
    marginTop: 20,
  },
})
