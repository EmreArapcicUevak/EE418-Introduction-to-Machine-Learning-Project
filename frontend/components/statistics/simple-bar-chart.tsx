import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title: string;
  maxValue?: number;
}

export function SimpleBarChart({ data, title, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  const chartWidth = width - 80;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chart}>
        {data.map((item, index) => {
          const barWidth = (item.value / max) * chartWidth;
          const percentage = ((item.value / max) * 100).toFixed(0);
          
          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              
              <View style={styles.barWrapper}>
                <LinearGradient
                  colors={item.color ? [item.color, item.color + 'CC'] : ['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.bar, { width: Math.max(barWidth, 20) }]}
                >
                  <Text style={styles.barValue}>
                    {item.value.toLocaleString()}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  chart: {
    gap: 12,
  },
  barContainer: {
    gap: 6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
    color: '#000000',
  },
  barWrapper: {
    height: 36,
  },
  bar: {
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 40,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
