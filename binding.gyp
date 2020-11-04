{
  'targets': [
    {
      'target_name': 'bleno',
      'conditions': [
        ['OS=="mac"', {
          'dependencies': [
            'lib/mac/binding.gyp:binding',
          ],
        }],
      ],
    },
  ],
}
