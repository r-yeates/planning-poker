export type ScaleType = 'fibonacci' | 'modified-fibonacci' | 't-shirt' | 'powers-of-two';

export interface EstimationScale {
  name: string;
  values: (number | string)[];
  type: ScaleType;
}

// Tooltip mappings for each scale type
export const SCALE_TOOLTIPS: Record<ScaleType, Record<string | number, string>> = {
  fibonacci: {
    0: '0 Points - No work or already done',
    1: '1 Point - Very small task, minor fix',
    2: '2 Points - Small task, simple change',
    3: '3 Points - Medium task, some complexity',
    5: '5 Points - Large task, significant work',
    8: '8 Points - Very large task, major feature',
    13: '13 Points - Epic task, needs breakdown',
    21: '21 Points - Huge epic, definitely break down',
    34: '34 Points - Massive epic, must be broken down',
    '?': 'Unknown - Need more information',
    '☕': 'Break time - Let\'s take a break'
  },
  'modified-fibonacci': {
    0: '0 Points - No work or already done',
    0.5: '0.5 Points - Tiny fix, documentation update',
    1: '1 Point - Very small task, minor fix',
    2: '2 Points - Small task, simple change',
    3: '3 Points - Medium task, some complexity',
    5: '5 Points - Large task, significant work',
    8: '8 Points - Very large task, major feature',
    13: '13 Points - Epic task, needs breakdown',
    20: '20 Points - Huge epic, definitely break down',
    '?': 'Unknown - Need more information',
    '☕': 'Break time - Let\'s take a break'
  },
  't-shirt': {
    'XS': 'Extra Small - Tiny fix or update',
    'S': 'Small - Simple task with low complexity',
    'M': 'Medium - Standard task with some complexity',
    'L': 'Large - Complex task, significant effort',
    'XL': 'Extra Large - Major feature or epic',
    'XXL': 'Extra Extra Large - Huge epic, break it down',
    '?': 'Unknown - Need more information',
    '☕': 'Break time - Let\'s take a break'
  },
  'powers-of-two': {
    0: '0 Points - No work or already done',
    1: '1 Point - Very small task, minor fix',
    2: '2 Points - Small task, simple change',
    4: '4 Points - Medium task, moderate complexity',
    8: '8 Points - Large task, significant work',
    16: '16 Points - Very large task, major feature',
    32: '32 Points - Epic task, needs breakdown',
    64: '64 Points - Massive epic, must be broken down',
    '?': 'Unknown - Need more information',
    '☕': 'Break time - Let\'s take a break'
  }
};

export const ESTIMATION_SCALES: Record<ScaleType, EstimationScale> = {
  fibonacci: {
    name: 'Fibonacci',
    type: 'fibonacci',
    values: [0, 1, 2, 3, 5, 8, 13, 21, 34, '?', '☕']
  },
  'modified-fibonacci': {
    name: 'Modified Fibonacci',
    type: 'modified-fibonacci',
    values: [0, 0.5, 1, 2, 3, 5, 8, 13, 20, '?', '☕']
  },
  't-shirt': {
    name: 'T-Shirt Sizes',
    type: 't-shirt',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕']
  },
  'powers-of-two': {
    name: 'Powers of Two',
    type: 'powers-of-two',
    values: [0, 1, 2, 4, 8, 16, 32, 64, '?', '☕']
  }
};
