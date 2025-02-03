import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Input } from '@rneui/themed'
import { router } from 'expo-router'
import { handleSignIn } from '../../utils/auth-hooks'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    try {
      const { error } = await handleSignIn(email, password)
      
      if (error) {
        Alert.alert(
          'Login Failed',
          error.message || 'Invalid login credentials. Please check your email and password.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'A network error occurred. Please check your connection and try again.',
        [{ text: 'OK' }]
      )
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign In" disabled={loading} onPress={signInWithEmail} />
      </View>
      <Button 
        type="clear" 
        title="Don't have an account? Sign Up" 
        onPress={() => router.push('/signup')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})
