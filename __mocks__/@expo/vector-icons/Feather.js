import React from 'react';

const mockFeather = props => {
  return React.createElement('Feather', props, props.children);
};

// Make the mock callable as both a function and a component
Object.assign(mockFeather, {
  __esModule: true,
  default: mockFeather,
});

module.exports = mockFeather; 