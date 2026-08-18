import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VRTSessionRecord {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  timestamp: string; // ISO String
  dizzinessRating: number; // 1-5 scale
  completedStepsCount: number;
  totalStepsCount: number;
}

export interface VRTStats {
  totalCompletedSessions: number;
  currentStreakDays: number;
  lastSessionDate: string | null; // YYYY-MM-DD
}

const SESSIONS_KEY = '@vertease_vrt_sessions';
const STATS_KEY = '@vertease_vrt_stats';

export const getVRTSessions = async (): Promise<VRTSessionRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load VRT sessions:', error);
    return [];
  }
};

export const getVRTStats = async (): Promise<VRTStats> => {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) {
      return {
        totalCompletedSessions: 0,
        currentStreakDays: 0,
        lastSessionDate: null,
      };
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load VRT stats:', error);
    return {
      totalCompletedSessions: 0,
      currentStreakDays: 0,
      lastSessionDate: null,
    };
  }
};

export const saveVRTSession = async (
  exerciseId: string,
  exerciseTitle: string,
  dizzinessRating: number,
  completedStepsCount: number,
  totalStepsCount: number
): Promise<{ sessions: VRTSessionRecord[]; stats: VRTStats }> => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newRecord: VRTSessionRecord = {
      id: `vrt_${Date.now()}`,
      exerciseId,
      exerciseTitle,
      timestamp: now.toISOString(),
      dizzinessRating,
      completedStepsCount,
      totalStepsCount,
    };

    const currentSessions = await getVRTSessions();
    const updatedSessions = [newRecord, ...currentSessions];
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));

    // Update Stats & Streak
    const currentStats = await getVRTStats();
    let newStreak = currentStats.currentStreakDays;

    if (!currentStats.lastSessionDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(currentStats.lastSessionDate);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (currentStats.lastSessionDate === todayStr) {
        // Already did session today, keep streak
      } else if (diffDays <= 2) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const updatedStats: VRTStats = {
      totalCompletedSessions: currentStats.totalCompletedSessions + 1,
      currentStreakDays: newStreak,
      lastSessionDate: todayStr,
    };

    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));

    return { sessions: updatedSessions, stats: updatedStats };
  } catch (error) {
    console.error('Failed to save VRT session:', error);
    throw error;
  }
};
