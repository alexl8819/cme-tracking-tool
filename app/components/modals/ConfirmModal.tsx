import React from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function ConfirmModal ({ modal: { closeModal } }) {
  return (
    <View style={styles.container}>
      <Text>Are you sure?</Text>
      <Button onPress={closeModal} title="Yes" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 30
  },
});
