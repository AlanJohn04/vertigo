export interface VRTStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationSeconds: number;
}

export interface VRTExercise {
  id: string;
  title: string;
  subtitle: string;
  category: 'BPPV Relief' | 'Gaze Stabilization' | 'Balance & Habituation';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  description: string;
  targetConditions: string[];
  safetyWarning: string;
  steps: VRTStep[];
}

export const VRT_EXERCISES: VRTExercise[] = [
  {
    id: 'brandt-daroff',
    title: 'Brandt-Daroff Exercises',
    subtitle: 'Positional adaptation for BPPV relief',
    category: 'BPPV Relief',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    description:
      'Brandt-Daroff exercises help dislodge stray calcium crystals in the inner ear that cause benign paroxysmal positional vertigo (BPPV).',
    targetConditions: ['BPPV', 'Positional Vertigo', 'Inner Ear Imbalance'],
    safetyWarning:
      'Mild dizziness during the movement is expected. Stop immediately if you experience severe nausea, sharp headache, or vision loss.',
    steps: [
      {
        stepNumber: 1,
        title: 'Sit Upright',
        instruction: 'Sit on the edge of your bed or sofa with your feet flat on the floor.',
        durationSeconds: 30,
      },
      {
        stepNumber: 2,
        title: 'Lie Down on Left Side',
        instruction: 'Turn your head 45 degrees to the right and lie down quickly on your left side. Keep your head tilted.',
        durationSeconds: 30,
      },
      {
        stepNumber: 3,
        title: 'Return to Center',
        instruction: 'Sit back up straight on the edge of the bed and wait until any dizziness subsides.',
        durationSeconds: 30,
      },
      {
        stepNumber: 4,
        title: 'Lie Down on Right Side',
        instruction: 'Turn your head 45 degrees to the left and lie down quickly on your right side. Keep your head tilted.',
        durationSeconds: 30,
      },
      {
        stepNumber: 5,
        title: 'Final Rest Position',
        instruction: 'Sit upright again for 30 seconds. Repeat 5 times in a session.',
        durationSeconds: 30,
      },
    ],
  },
  {
    id: 'gaze-stabilization-x1',
    title: 'VOR X1 Gaze Stabilization',
    subtitle: 'Vestibular-Ocular Reflex recalibration',
    category: 'Gaze Stabilization',
    difficulty: 'Beginner',
    estimatedMinutes: 5,
    description:
      'Retrains your brain to maintain clear focus while your head is moving, reducing dizziness during daily activities like walking or driving.',
    targetConditions: ['Labyrinthitis', 'Vestibular Neuritis', 'General Dizziness'],
    safetyWarning:
      'Keep your eyes fixed on the visual target. Move your head only as fast as you can while keeping the target clear.',
    steps: [
      {
        stepNumber: 1,
        title: 'Set Target Focus',
        instruction: 'Hold a card or your thumb at arm\'s length directly in front of your eyes.',
        durationSeconds: 15,
      },
      {
        stepNumber: 2,
        title: 'Horizontal Head Shakes',
        instruction: 'Move your head side to side (saying "no") while keeping your eyes locked onto the target.',
        durationSeconds: 45,
      },
      {
        stepNumber: 3,
        title: 'Rest & Focus',
        instruction: 'Pause and take slow deep breaths while focusing on a stationary point.',
        durationSeconds: 20,
      },
      {
        stepNumber: 4,
        title: 'Vertical Head Nodding',
        instruction: 'Move your head up and down (nodding "yes") while maintaining steady gaze focus on the target.',
        durationSeconds: 45,
      },
    ],
  },
  {
    id: 'cawthorne-cooksey',
    title: 'Cawthorne-Cooksey Eye & Head Movements',
    subtitle: 'Habituation therapy for motion sensitivity',
    category: 'Balance & Habituation',
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    description:
      'A series of controlled eye and head movements designed to desensitize the central nervous system to vertigo-inducing movements.',
    targetConditions: ['Motion Sickness', 'Vestibular Migraine', 'Chronic Imbalance'],
    safetyWarning:
      'Perform these exercises sitting down first. Only progress to standing when guided by your healthcare provider.',
    steps: [
      {
        stepNumber: 1,
        title: 'Eye Movements Only',
        instruction: 'Look up and down, then side to side without moving your head. Start slow, then increase speed.',
        durationSeconds: 30,
      },
      {
        stepNumber: 2,
        title: 'Focus Tracking',
        instruction: 'Focus on your finger held 1 foot away, move it toward your nose and back out.',
        durationSeconds: 30,
      },
      {
        stepNumber: 3,
        title: 'Head Bends',
        instruction: 'Bending head forward and backward, then turning side to side with eyes open.',
        durationSeconds: 45,
      },
      {
        stepNumber: 4,
        title: 'Shoulder Shrugs & Turns',
        instruction: 'Shrug shoulders up and down, then rotate torso left and right.',
        durationSeconds: 45,
      },
    ],
  },
];
