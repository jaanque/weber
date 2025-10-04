export const shapes = [
  {
    name: 'Rectangle',
    icon: (
      <svg viewBox="0 0 100 80">
        <rect x="0" y="0" width="100" height="80" />
      </svg>
    ),
    type: 'rectangle',
  },
  {
    name: 'Circle',
    icon: (
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50" />
      </svg>
    ),
    type: 'circle',
  },
  {
    name: 'Triangle',
    icon: (
      <svg viewBox="0 0 100 100">
        <polygon points="50,0 100,100 0,100" />
      </svg>
    ),
    type: 'triangle',
  },
  {
    name: 'Oval',
    icon: (
      <svg viewBox="0 0 100 60">
        <ellipse cx="50" cy="30" rx="50" ry="30" />
      </svg>
    ),
    type: 'oval',
  },
  {
    name: 'Star',
    icon: (
      <svg viewBox="0 0 100 100">
        <polygon points="50,0 61.8,38.2 100,38.2 69.1,61.8 80.9,100 50,76.4 19.1,100 30.9,61.8 0,38.2 38.2,38.2" />
      </svg>
    ),
    type: 'star',
  },
];