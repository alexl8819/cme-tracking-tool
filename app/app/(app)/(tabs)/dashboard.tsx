import { Buffer } from '@craftzdog/react-native-buffer';
import { useState, useEffect, useMemo } from 'react';
// import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Button, Text, BackHandler, TextInput, Image, StyleSheet, Platform } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// import { pick, types } from '@react-native-documents/picker';
import * as ImagePicker from 'expo-image-picker';
import { useModal } from 'react-native-modalfy';

import TextRecognition from '@react-native-ml-kit/text-recognition';
import SkeletonLoading from 'react-native-skeleton-loading';
import Octicons from '@expo/vector-icons/Octicons';

import { useSession } from '@/contexts/auth';
import { useAccount } from '@/contexts/account';
import ProgressChart from '@/components/ProgressChart';
import CourseList from '@/components/CourseList';
import parseLines from '@/lib/parse';
import { downloadAsset, uploadAsset } from '@/lib/fs';
import { getCourse, getCourses, removeCourse, submitCourse } from '@/lib/fetch/courses';
import { encryptAes, decryptAes, toHexValue, toBytes } from '@/lib/crypto';

export default function HomeScreen() {
  // TODO: move to redux or nanostores?
  const [cursor, setCursor] = useState(null);
  const [backpresses, setBackpresses] = useState(0);

  const [courses, setCourses] = useState([]);
  const [totalHoursAttended, setTotalHoursAttended] = useState(0);
  
  const { signOut, createSessionKey, session, derivedKey } = useSession();
  const { getInfo, renewalDate, currentReqs, seed } = useAccount();

  // Overrides back press handler to not return to login screen
  const backAction = () => {
    if (cursor != null) {
      setCursor(null);
    } else if (backpresses >= 2) {
      console.log('exiting');
      setBackpresses(0);
      BackHandler.exitApp();
    } else {
      setBackpresses(backpresses + 1);
    }
    return true;
  };

  const authToken = session['access_token'];
  
  const { openModal } = useModal();

  useEffect(() => {
    const fetchAccountInfo = async () => await getInfo()(authToken);
    const fetchAllCourses = async () => {
      const coursesRegistered = await getCourses()(authToken);
      // Compute completed hours
      const computedHours = coursesRegistered.reduce((acc, course) => {
        acc += course.creditHours;
        return acc;
      }, totalHoursAttended);
      setTotalHoursAttended(computedHours);
      setCourses(coursesRegistered);
    };
    const deriveSessionKey = async () => {
      if (seed) {
        try {
          await createSessionKey(seed);
        } catch (err) {
          // Sign out if key is not created
          await signOut();
        }
      }
    }
    if (!renewalDate || !currentReqs) {
      fetchAccountInfo();
      fetchAllCourses();
    }
    if (!derivedKey) {
      deriveSessionKey();
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [session, seed, cursor, backpresses]);
  // TODO: open new modal/screen with image and editable fields to correct ocr
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
        { cursor != null ? (
          <>
            <ThemedView style={styles.titleContainer}>
              <Octicons.Button name="arrow-left" size={32} color="white" backgroundColor="transparent" onPress={() => setCursor(null) } />
              <ThemedText type="title">{ cursor.name }</ThemedText>
            </ThemedView>
            <ThemedView style={styles.courseInnerContainer}>
              <Octicons name="calendar" size={24} color="white" />
              <ThemedText type="subtitle" style={styles.textItem}>Attended on { dayjs(cursor.attended).format('MMMM DD YYYY') }</ThemedText>
            </ThemedView>
            <ThemedView style={styles.courseInnerContainer}>
              <Octicons name="location" size={24} color="white" />
              <ThemedText type="subtitle" style={styles.textItem}>Location: { cursor.location }</ThemedText>
            </ThemedView>
            <ThemedView style={styles.courseInnerContainer}>
              <Octicons name="clock" size={24} color="white" />
              <ThemedText type="subtitle" style={styles.textItem}>Credit Hours: { cursor.creditHours }</ThemedText>
            </ThemedView>
            <ThemedView style={styles.courseInnerContainer}>
              <TextInput multiline={true} numberOfLines={4} value={''} />
            </ThemedView>
            <ThemedView style={styles.trashContainer}>
              <Octicons.Button name="file-badge" size={24} color="white">View Completion Certification</Octicons.Button>
            </ThemedView>
            <ThemedView style={styles.trashContainer}>
              <Octicons.Button name="trash" size={24} color="white" backgroundColor="red">Remove Course</Octicons.Button>
            </ThemedView>
          </>
        ) : (
        <>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" onPress={() => signOut()}>Welcome {session.user.email}!</ThemedText>
        </ThemedView>

        <ThemedView style={styles.chartContainer}>
          <ProgressChart isLoading={!currentReqs} percentageCompleted={currentReqs ? (totalHoursAttended / currentReqs.totalHours) : 0 } />
        </ThemedView>

        <ThemedView style={styles.renewalContainer}>
          <ThemedText title="subtitle">Next renewal occurs { dayjs().to(dayjs(renewalDate)) }</ThemedText>
        </ThemedView>

        <CourseList courses={courses} onSelect={(selected) => {
          const course = courses.find((course) => course.id === selected);
          setCursor(course ? course : null);
        }} />
      
        <ThemedView style={styles.addCourseContainer}>
          <Octicons.Button name="plus-circle" size={48} color="white" backgroundColor="transparent" onPress={async () => {
            // TODO: prompt for camera or media library
            openModal('OptionModal');
            // TODO: maybe add support PDF?
            /*const fileResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: false,
              allowsEditing: false,
              base64: true,
              aspect: [4, 3],
              quality: 1,
            });
            // image props
            const uri = fileResult.assets[0].uri;
            const cert = fileResult.assets[0].base64;
            const mimeType = fileResult.assets[0].mimeType;
            // analyze text
            const recognitionResult = await TextRecognition.recognize(uri);
            const { l, ch, ds } = parseLines(recognitionResult.text);
            console.log(l)
            console.log(ch)
            console.log(ds)

            setRecognized(recognitionResult.text);

            const params = {
              name: '',
              attended: '',
              location: '',
              creditHours: 0.0
            };

            // TODO: display modal confirming          
            await addNewCourse({
              params,
              asset: {
                contents: cert,
                mimeType
              }
            }, derivedKey, authToken);*/
          }} />
        </ThemedView>
        </>) 
        }
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  renewalContainer: {
    fontSize: '24',
    gap: 8,
    marginBottom: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBotton: 8
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  courseInnerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'start',
    marginBottom: 15
  },
  trashContainer: {
    display: 'flex',
    justifyContent: 'start',
    marginTop: 8,
    marginBottom: 8
  },
  addCourseContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5
  },
  textItem: {
    marginLeft: 30
  }
});

async function addNewCourse (course, key, authToken) {
  const { params, asset } = course;
  const ciphertext = await encryptAes(asset.contents, key, 'base64');    
  
  try {
    await uploadAsset({ 
      contents: ciphertext, 
      mimeType: asset.mimeType,
      params
    }, submitCourse, authToken);
  } catch (err) {
    console.error(err);
  }
}

async function previewCourse (courseId, authToken) {
  let courseInfo;
          
  try {
    courseInfo = await getCourse(courseId)(authToken);
  } catch (err) {
    console.error(err);
  } 
  console.log(courseInfo);
  const assetUrl = courseInfo[0].asset.signedUrl;
  const { result, mimeType } = await downloadAsset(assetUrl);
  const decryptable = Buffer.from(result, 'base64').toString('hex');
  const decoded = await decryptAes(decryptable, derivedKey);
  const data = Buffer.from(decoded).toString('base64');
  const certDataURI = `data:${mimeType};base64,${data}`;
}

async function removeFromCourses (courseId, authToken) {
  try {
    await removeCourse(courseId)(authToken);
  } catch (err) {
    console.error(err);
  }
}
