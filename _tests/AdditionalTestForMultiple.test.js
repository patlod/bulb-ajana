const binaryStringToNumber = binString => {
  if (!/^[01]+$/.test(binString)) {
    throw new Error('Not a binary number.');
  }

  return parseInt(binString, 2);
};

describe('binaryStringToNumber', () => {
  describe('given an invalid binary string', () => {
    test('composed of non-numbers throws Error', () => {
      expect(() => binaryStringToNumber('abc')).toThrowError(Error);
    });

    test('with extra whitespace throws Error', () => {
      expect(() => binaryStringToNumber('  100')).toThrowError(Error);
    });
  });

  describe('given a valid binary string', () => {
    test('returns the correct number', () => {
      expect(binaryStringToNumber('100')).toBe(4);
    });
  });
});



/**
 * =========== JEST test function =============
 */
function sum(a,b){
  return a + b
}
test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
/**
 * ============================================
 */