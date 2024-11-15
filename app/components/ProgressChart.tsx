import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import ContentLoader, { Rect, Circle, Path } from 'react-content-loader/native';

export default function ProgressChart ({ isLoading, percentageCompleted }) {
  const progressValue = Math.ceil(percentageCompleted * 100);

  if (isLoading) {
    return (
      <ContentLoader 
        speed={1} 
        width={340} 
        height={200} 
        viewBox="0 0 340 200" 
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Circle cx="107" cy="101" r="100" />
      </ContentLoader>
    );
  }
  
  return (
    <PieChart
      donut
      innerRadius={75}
      innerCircleBorderColor="#333"
      data={[
        { value: progressValue, color: progressValue < 100 ? '#FEFE33' : '#00FF7F' },
        { value: (100 - progressValue), color: 'lightgray' }
      ]}
      centerLabelComponent={() => {
        return (
          <View style={styles.centerText}>
            <Text style={{fontSize: 40}}>{ progressValue }%</Text>
            <Text style={{fontSize: 20}}>completed</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centerText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}); 
