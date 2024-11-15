import { View, StyleSheet } from 'react-native';
import Auth from '@/components/Auth';
import { useSession } from '@/contexts/auth';

export default function SignIn() {
  const { signIn } = useSession();  

  return (
    <View style={styles.loginView}>
      <Auth login={signIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  loginView: {
    backgroundColor: 'white',
    display: 'flex',
    flex: 1
  }
});
