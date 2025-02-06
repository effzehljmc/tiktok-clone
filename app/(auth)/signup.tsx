import { useState } from 'react'
import { Alert, StyleSheet, View, Text } from 'react-native'
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
      <Text style={styles.title}>Create Account</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Username"
          leftIcon={{ type: 'font-awesome', name: 'user', color: '#FFFFFF' }}
          onChangeText={setUsername}
          value={username}
          placeholder="username"
          autoCapitalize="none"
          disabled={loading}
          inputStyle={styles.input}
          labelStyle={styles.label}
          placeholderTextColor="#666666"
          inputContainerStyle={styles.inputContainer}
          errorStyle={{ height: 0 }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: '#FFFFFF' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          disabled={loading}
          inputStyle={styles.input}
          labelStyle={styles.label}
          placeholderTextColor="#666666"
          inputContainerStyle={styles.inputContainer}
          errorStyle={{ height: 0 }}
          keyboardType="email-address"
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
          disabled={loading}
          inputStyle={styles.input}
          labelStyle={styles.label}
          placeholderTextColor="#666666"
          inputContainerStyle={styles.inputContainer}
          errorStyle={{ height: 0 }}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title={loading ? "Creating Account..." : "Sign Up"} 
          disabled={loading}
          onPress={signUpWithEmail}
          buttonStyle={styles.button}
          titleStyle={styles.buttonText}
          disabledStyle={styles.buttonDisabled}
        />
      </View>
      <Button 
        type="clear" 
        title="Already have an account? Sign In" 
        onPress={() => router.replace('/')}
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
