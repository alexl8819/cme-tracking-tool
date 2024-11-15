import React from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';

export default function OptionModal ({ modal: { closeModal } }) {
  return (
    <View style={styles.container}>
      <Octicons.Button name="device-camera" size={24} color="black" backgroundColor="transparent" onPress={closeModal}>Camera</Octicons.Button>
      <Octicons.Button name="image" size={24} color="black" backgroundColor="transparent" onPress={closeModal}>Media Library</Octicons.Button> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 40
  },
  button: {
    marginBottom: 40
  }
});
