/**
 * Tests for speech formatter to verify punctuation and formatting
 */

import { formatSpeechText } from './speechFormatter';

// Test cases
const testCases = [
  {
    input: 'hello world period how are you question mark',
    expected: 'Hello world. How are you?',
    description: 'Basic punctuation',
  },
  {
    input: 'I need to buy comma milk comma eggs comma and bread period',
    expected: 'I need to buy, milk, eggs, and bread.',
    description: 'Multiple commas',
  },
  {
    input: 'capital john went to capital new capital york',
    expected: 'John went to New York',
    description: 'Capitalization commands',
  },
  {
    input: 'this is amazing exclamation mark new line let me continue',
    expected: 'This is amazing!\nLet me continue',
    description: 'Exclamation and new line',
  },
  {
    input: 'the meeting is at 3 colon 30 PM',
    expected: 'The meeting is at 3:30 PM',
    description: 'Colon usage',
  },
  {
    input: 'email me at john at sign example dot com',
    expected: 'Email me at john@example.com',
    description: 'Email formatting',
  },
  {
    input: 'the price is dollar sign 99 period 99',
    expected: 'The price is $99.99',
    description: 'Currency formatting',
  },
  {
    input: 'she said quote hello world close quote period',
    expected: 'She said "hello world".',
    description: 'Quotation marks',
  },
  {
    input: 'item 1 semicolon item 2 semicolon item 3',
    expected: 'Item 1; item 2; item 3',
    description: 'Semicolons',
  },
  {
    input: 'uppercase hello there',
    expected: 'HELLO there',
    description: 'Uppercase command',
  },
];

let _passed = 0;
let _failed = 0;

testCases.forEach((test, _index) => {
  const result = formatSpeechText(test.input, false);
  const success = result === test.expected;

  if (success) {
    _passed++;
  } else {
    _failed++;
  }
});

// Export for potential Jest integration
export { testCases };
