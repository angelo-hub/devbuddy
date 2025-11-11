# React ESLint Configuration

This document explains the React-specific ESLint rules configured for DevBuddy.

## Plugins

### eslint-plugin-react
Provides React-specific linting rules for JSX and React patterns.

### eslint-plugin-react-hooks
Enforces the Rules of Hooks and validates hook dependencies.

## Configuration

### Parser Options

```json
{
  "ecmaFeatures": {
    "jsx": true
  }
}
```

Enables JSX parsing in TypeScript files.

### React Settings

```json
{
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

Automatically detects the React version from your package.json.

## Rules

### React Rules

#### `react/react-in-jsx-scope`: OFF
```typescript
// ✅ No need to import React in every file (React 17+ with new JSX transform)
export function Button() {
  return <button>Click me</button>;
}

// ❌ Old way (not required anymore)
import React from 'react';
export function Button() {
  return <button>Click me</button>;
}
```

**Why:** React 17+ uses the new JSX transform, so you don't need to import React in every file that uses JSX.

#### `react/prop-types`: OFF
```typescript
// ✅ Use TypeScript types instead of PropTypes
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

**Why:** We use TypeScript for type checking, so PropTypes are redundant.

### React Hooks Rules

#### `react-hooks/rules-of-hooks`: ERROR

Enforces the Rules of Hooks:
1. Only call hooks at the top level
2. Only call hooks from React functions

```typescript
// ✅ Good: Hook called at top level
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return <div>{count}</div>;
}

// ❌ Bad: Hook called conditionally
function MyComponent({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0); // ❌ Error!
  }
  return <div>Hello</div>;
}

// ❌ Bad: Hook called in a loop
function MyComponent({ items }) {
  for (let item of items) {
    const [state, setState] = useState(item); // ❌ Error!
  }
  return <div>Hello</div>;
}

// ❌ Bad: Hook called in a regular function
function handleClick() {
  const [count, setCount] = useState(0); // ❌ Error!
}
```

**Why:** Violating the Rules of Hooks leads to bugs and unpredictable behavior.

#### `react-hooks/exhaustive-deps`: WARN

Validates dependencies in `useEffect`, `useCallback`, and `useMemo`:

```typescript
// ✅ Good: All dependencies declared
function MyComponent({ userId }) {
  useEffect(() => {
    fetchUser(userId);
  }, [userId]); // ✅ userId is in dependencies
}

// ⚠️ Warning: Missing dependency
function MyComponent({ userId }) {
  useEffect(() => {
    fetchUser(userId);
  }, []); // ⚠️ Warning: userId should be in dependencies
}

// ✅ Good: ESLint will suggest adding missing deps
function MyComponent({ userId, userName }) {
  useEffect(() => {
    fetchUser(userId, userName);
  }, [userId, userName]); // ✅ All dependencies declared
}

// ✅ Good: Stable references don't need to be in deps
function MyComponent({ userId }) {
  const fetchUserData = useCallback(() => {
    fetchUser(userId);
  }, [userId]); // ✅ userId in dependencies
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]); // ✅ fetchUserData is in dependencies
}
```

**Why:** Missing dependencies can lead to stale closures and bugs. ESLint helps catch these issues.

### Common Patterns

#### Intentionally Empty Dependencies

Sometimes you want an effect to run only once on mount:

```typescript
// ✅ Intentionally empty - runs once on mount
useEffect(() => {
  initializeApp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Use the disable comment sparingly and only when you're certain the empty array is correct.

#### Function Dependencies

If you define a function inside the component, include it in dependencies or use `useCallback`:

```typescript
// ⚠️ Warning: fetchData changes on every render
function MyComponent({ userId }) {
  const fetchData = () => {
    fetchUser(userId);
  };
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // ⚠️ Warning: fetchData changes every render
}

// ✅ Option 1: Use useCallback
function MyComponent({ userId }) {
  const fetchData = useCallback(() => {
    fetchUser(userId);
  }, [userId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ fetchData is stable
}

// ✅ Option 2: Define function inside effect
function MyComponent({ userId }) {
  useEffect(() => {
    const fetchData = () => {
      fetchUser(userId);
    };
    fetchData();
  }, [userId]); // ✅ No function dependency needed
}
```

#### Object and Array Dependencies

Objects and arrays are compared by reference, not value:

```typescript
// ⚠️ Warning: config object changes on every render
function MyComponent() {
  const config = { apiUrl: 'https://api.example.com' };
  
  useEffect(() => {
    fetchData(config);
  }, [config]); // ⚠️ Effect runs on every render!
}

// ✅ Option 1: Use useMemo
function MyComponent() {
  const config = useMemo(
    () => ({ apiUrl: 'https://api.example.com' }),
    []
  );
  
  useEffect(() => {
    fetchData(config);
  }, [config]); // ✅ config is stable
}

// ✅ Option 2: Declare outside component
const CONFIG = { apiUrl: 'https://api.example.com' };

function MyComponent() {
  useEffect(() => {
    fetchData(CONFIG);
  }, []); // ✅ No dependency needed
}

// ✅ Option 3: Include primitive values directly
function MyComponent() {
  const apiUrl = 'https://api.example.com';
  
  useEffect(() => {
    fetchData({ apiUrl });
  }, [apiUrl]); // ✅ Primitive value
}
```

## Running the Linter

### Check for issues
```bash
npm run lint
```

### Auto-fix issues
```bash
npm run lint:fix
```

### Validate everything
```bash
npm run validate
```

## Common Warnings and How to Fix Them

### "React Hook useEffect has a missing dependency"

**Problem:**
```typescript
function MyComponent({ userId }) {
  useEffect(() => {
    fetchUser(userId);
  }, []); // ⚠️ Warning
}
```

**Fix:**
```typescript
function MyComponent({ userId }) {
  useEffect(() => {
    fetchUser(userId);
  }, [userId]); // ✅ Add missing dependency
}
```

### "React Hook useCallback has an unnecessary dependency"

**Problem:**
```typescript
const handleClick = useCallback(() => {
  console.log('clicked');
}, [userId]); // ⚠️ Warning: userId is not used
```

**Fix:**
```typescript
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // ✅ Remove unused dependency
```

### "React Hook is called conditionally"

**Problem:**
```typescript
function MyComponent({ condition }) {
  if (condition) {
    const [value, setValue] = useState(0); // ❌ Error
  }
}
```

**Fix:**
```typescript
function MyComponent({ condition }) {
  const [value, setValue] = useState(0); // ✅ Always call hooks
  
  if (!condition) {
    return null;
  }
  
  return <div>{value}</div>;
}
```

## Custom Hooks

Custom hooks must follow the same rules:

```typescript
// ✅ Good: Custom hook follows rules
function useUser(userId: string) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return user;
}

// ❌ Bad: Conditional hook call
function useUser(userId?: string) {
  if (!userId) {
    return null;
  }
  
  const [user, setUser] = useState(null); // ❌ Error!
  return user;
}

// ✅ Good: Always call hooks, handle condition differently
function useUser(userId?: string) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return user;
}
```

## Configuration in Context

The ESLint config is split by file type:

### Webview Files (webview-ui/**/*.tsx, webview-ui/**/*.ts)
- Full React + Hooks rules enabled
- Browser environment
- JSX enabled

### Extension Files (src/**/*.ts)
- React rules disabled (no React in extension code)
- Node environment
- No JSX

## Best Practices

1. **Always declare all dependencies** - Let ESLint guide you
2. **Use `useCallback` for functions** - When passing to child components
3. **Use `useMemo` for objects/arrays** - When used as dependencies
4. **Extract constants** - Define outside component if they don't change
5. **Custom hooks start with "use"** - ESLint will check them automatically
6. **Trust the linter** - It catches bugs you might miss

## Learn More

- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react)
- [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- [React DevTools](https://react.dev/learn/react-developer-tools) - Helps debug hook dependencies

## Quick Reference

```typescript
// ✅ Correct patterns
useState(initialValue);
useEffect(() => { /* ... */ }, [deps]);
useCallback(() => { /* ... */ }, [deps]);
useMemo(() => value, [deps]);

// ❌ Incorrect patterns
if (condition) useState(0);        // Don't call conditionally
useState(Math.random());           // Don't call in loops
return condition && useState(0);   // Don't call after return
```

---

**Remember:** The linter is your friend! It catches bugs before they happen. If ESLint warns about hooks, take it seriously. 🪝


