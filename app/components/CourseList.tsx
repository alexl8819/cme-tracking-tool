import { View, Pressable, StyleSheet } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useModal } from 'react-native-modalfy';
import ContentLoader, { Rect, Circle, Path } from 'react-content-loader/native';
import Octicons from '@expo/vector-icons/Octicons';
import dayjs from 'dayjs';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

function ListItem ({ id, name, location, attended, onSelect }) {
  const { openModal } = useModal();

  return (
    <Pressable
      onPress={() => onSelect(id)}
      onLongPress={() => openModal('ConfirmModal')}
      style={{ height: '200px' }}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.iconColumn}>
          <Octicons name="file-badge" size={32} color="white" />
        </ThemedView>
        <ThemedView style={styles.column}>
          <ThemedText type="subtitle">{name}</ThemedText>
          <ThemedText>Attended on {dayjs(attended).format('MMMM DD YYYY')}</ThemedText> 
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

export default function CourseList ({ courses, onSelect }) {
  if (!courses || !courses.length) {
    return <SkeletonList />
  }

  courses = courses.map((course) => Object.assign(course, {
    onSelect
  }));

  return (
    <FlashList
      renderItem={renderItem}
      data={courses}
      estimatedItemSize={10}
    />
  );
}

const styles = StyleSheet.create({
  iconColumn: {
    flexDirection: 'column',
    marginRight: 20
  },
  column: {
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    color: "white",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "none",
    alignItems: "center",
    justifyContent: "start",
    marginBottom: 10
  },
});

function renderItem ({ item }): ListItemRenderInfo<T> {
  return (
    <ListItem 
      id={item.id}
      name={item.name}
      attended={item.attended}
      location={item.location}
      onSelect={item.onSelect}
    />
  );
}

function SkeletonList () {
  return (
    <ContentLoader
    speed={1}
    width={400}
    height={150}
    viewBox="0 0 400 150"
    backgroundColor="#f3f3f3"
    foregroundColor="#ecebeb"
    >
      <Circle cx="10" cy="20" r="8" />
      <Rect x="25" y="15" rx="5" ry="5" width="220" height="17" />
      <Circle cx="10" cy="50" r="8" />
      <Rect x="25" y="45" rx="5" ry="5" width="220" height="17" />
      <Circle cx="10" cy="80" r="8" />
      <Rect x="25" y="75" rx="5" ry="5" width="220" height="17" />
    </ContentLoader>
  )
}
