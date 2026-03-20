const { evaluateGuess } = require('./main');

test('evaluateGuess returns G for correct positions', () => {
  expect(evaluateGuess('apple', 'apple')).toEqual(['G','G','G','G','G']);
});

test('evaluateGuess returns X for all wrong letters', () => {
  expect(evaluateGuess('apple', 'zzzzz')).toEqual(['X','X','X','X','X']);
});

test('evaluateGuess handles Y and G correctly', () => {
  expect(evaluateGuess('train', 'brain')).toEqual(['X','G','G','G','G']);
});

test('evaluateGuess handles repeated letters correctly', () => {
  expect(evaluateGuess('apple', 'poppy')).toEqual(['Y','X','G','X','X']);
});
