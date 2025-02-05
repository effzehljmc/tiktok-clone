import { useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Input } from '@rneui/themed'
import { router } from 'expo-router'
import { handleSignUp } from '../../utils/auth-hooks'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUpWithEmail() {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error, message } = await handleSignUp(email, password, username)
      
      if (error) {
        Alert.alert(
          'Sign Up Failed',
          error.message || 'Could not create account. Please try again.',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert(
          'Success',
          message || 'Account created successfully! Please check your email for verification.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Clear the form
              setEmail('')
              setPassword('')
              setUsername('')
              // Navigate back to sign in
              router.replace('/')
            }
          }]
        )
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'A network error occurred. Please check your connection and try again.',
        [{ text: 'OK' }]
      )
      console.error('Sign up error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Username"
          leftIcon={{ type: 'font-awesome', name: 'user' }}
          onChangeText={setUsername}
          value={username}
          placeholder="username"
          autoCapitalize="none"
          disabled={loading}
          errorStyle={{ height: 0 }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          disabled={loading}
          errorStyle={{ height: 0 }}
          keyboardType="email-address"
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
          disabled={loading}
          errorStyle={{ height: 0 }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title={loading ? "Creating Account..." : "Sign Up"} 
          disabled={loading} 
          onPress={signUpWithEmail}
          loading={loading}
        />
      </View>
      <Button 
        type="clear" 
        title="Back to Sign In" 
        onPress={() => router.push('/')}
        disabled={loading}
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
