#!/bin/zsh
cd -- "${0:A:h}"
if [[ ! -d node_modules ]]; then
  npm install || exit 1
fi
printf '\nAI Grand Prix paddock: http://localhost:4174\nKeep this Terminal window open while exploring. Press Control-C to stop.\n\n'
npm run dev -- --open
