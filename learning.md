# Project Structure and Implementation Patterns

## Project Overview
- React Native TypeScript project
- Uses React Navigation for routing
- Mock data pattern for development
- Component-based architecture with separation of concerns

## Key Components
- **NewsCard**: Reusable card component for displaying news articles
- **CategorySelector**: Handles news category filtering
- **ArticleDetailScreen**: Detailed view of articles
- **ProfileScreen**: User profile and settings management

## Data Flow
1. Mock data is stored in `data/mockData.ts`
2. Data is passed down through props with proper TypeScript interfaces
3. Components are typed with proper interfaces for props and navigation

## Implementation Patterns

### Navigation
- Uses React Navigation's stack navigator
- Routes are defined in RootStackParamList types
- Navigation prop typing ensures type-safe navigation calls
```typescript
type RootStackParamList = {
  ArticleDetail: { articleId: string };
  // other routes...
};
```

### TypeScript Integration
- Interfaces defined for all data structures
- Navigation props properly typed
- Component props defined with interfaces
```typescript
interface NewsCardProps {
  article: Article;
}
```

### External Link Handling
- Uses React Native's Linking API
- Always check if URL exists before attempting to open
```typescript
onPress={() => article.url && Linking.openURL(article.url)}
```

## Debugging Approaches

### TypeScript Errors
1. **Missing Properties**
   - Check interface definitions
   - Ensure mock data includes all required properties
   - Verify prop passing in parent components

2. **Navigation Type Errors**
   - Ensure proper typing of navigation prop
   - Check RootStackParamList includes all routes
   - Verify navigation parameters match defined types

3. **Component Prop Errors**
   - Define proper interfaces for props
   - Use optional properties when appropriate
   - Implement null checks for optional data

### Common Patterns for Fixes
1. **Type Definition**
```typescript
interface Article {
  id: string;
  title: string;
  // ... other required properties
  url?: string; // Optional properties with ?
}
```

2. **Null Checking**
```typescript
if (!article || !article.id) {
  return null;
}
```

3. **Type Assertion (when necessary)**
```typescript
const foundArticle = mockNewsData.find(item => item.id === articleId) as Article;
```

## Best Practices

### Component Structure
1. Define interfaces at the top
2. Initialize hooks and state
3. Define handler functions
4. Return JSX with proper type checking

### State Management
- Use typed useState hooks
- Initialize with proper types
- Handle loading and error states

### Style Organization
- StyleSheet.create for type-safe styles
- Group related styles together
- Use consistent naming conventions

### Error Handling
1. Validate data before rendering
2. Provide fallback UI for missing data
3. Use proper type guards
4. Handle async operations safely

## Future Improvements
1. Implement proper API integration
2. Add error boundaries
3. Implement proper state management (e.g., Redux)
4. Add unit tests
5. Implement proper loading states

## Common Issues and Solutions

### Issue: Component Not Rendering
- Check if all required props are passed
- Verify data structure matches interface
- Ensure proper null checking

### Issue: Navigation Errors
- Verify route names match RootStackParamList
- Check parameter types match route definitions
- Ensure navigation prop is properly typed

### Issue: TypeScript Errors
- Check interface definitions
- Verify data shapes match interfaces
- Use optional properties when appropriate
- Implement proper type guards

## New Learnings (March 5, 2025)

### React Native Performance Optimization
1. **FlatList Optimization Techniques**
   ```typescript
   <FlatList
     windowSize={5}
     maxToRenderPerBatch={5}
     updateCellsBatchingPeriod={50}
     removeClippedSubviews={true}
     initialNumToRender={10}
   />
   ```
   - windowSize controls render window size
   - maxToRenderPerBatch limits batch processing
   - removeClippedSubviews helps with memory usage
   - initialNumToRender optimizes initial load

2. **React.memo Usage**
   ```typescript
   const areEqual = (prevProps: Props, nextProps: Props) => {
     // Compare only necessary props
     return prevProps.id === nextProps.id;
   };
   export default memo(Component, areEqual);
   ```
   - Prevents unnecessary re-renders
   - Custom comparison function for fine control
   - Important for list item components

### Platform-Specific Development
1. **RefreshControl Differences**
   ```typescript
   Platform.select({
     ios: <RefreshControl tintColor="#0066cc" />,
     android: <RefreshControl colors={['#0066cc']} />
   })
   ```
   - Different props for iOS and Android
   - Use Platform.select for clean conditionals
   - Test both platforms for consistency

### Navigation Best Practices
1. **Type-Safe Navigation**
   ```typescript
   type RootStackParamList = {
     Screen: undefined | { param: string };
   };
   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
   ```
   - Define types for all routes and params
   - Use proper navigation typing
   - Handle undefined routes properly

### Component Architecture
1. **Toast Notifications**
   ```typescript
   import { Toaster, toast } from 'sonner-native';
   // Provider at app root
   <Toaster />
   // Usage in components
   toast.success('Operation successful');
   ```
   - Global toast provider setup
   - Consistent error/success messaging
   - Non-blocking user feedback

2. **Key Management in Lists**
   - Avoid using index as key
   - Ensure unique key generation for dynamic lists
   - Handle key collisions in load more scenarios

### Error Prevention
1. **TypeScript Guards**
   ```typescript
   if (!item || !item.id) {
     return null;
   }
   ```
   - Always check for undefined/null
   - Use early returns for invalid data
   - Implement proper error boundaries

2. **Performance Monitoring**
   - Watch for VirtualizedList warnings
   - Monitor render performance
   - Implement proper loading states

### Development Workflow
1. **Git Commit Organization**
   - Use semantic commit messages
   - Group related changes
   - Document breaking changes

2. **Code Documentation**
   - Document complex logic
   - Add TypeScript interfaces
   - Comment performance optimizations
