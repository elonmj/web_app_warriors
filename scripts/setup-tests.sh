#!/bin/bash

# Install testing libraries and their types
npm install --save-dev \
  @testing-library/react@^14.0.0 \
  @testing-library/jest-dom@^6.1.0 \
  @testing-library/user-event@^14.4.3 \
  @types/testing-library__jest-dom@^5.14.9 \
  jest@^29.6.0 \
  jest-environment-jsdom@^29.6.0 \
  @types/jest@^29.5.0 \
  jest-watch-typeahead@^2.2.2

# Create directories if they don't exist
mkdir -p src/app/components/__tests__
mkdir -p src/setupTests

# Update tsconfig.json to include test files
echo '{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  },
  "include": ["**/*.ts", "**/*.tsx", "**/__tests__/**/*"]
}' > tsconfig.test.json

# Make the script executable
chmod +x scripts/setup-tests.sh

echo "Testing dependencies installed successfully!"
echo "You can now run 'npm test' to run your tests"