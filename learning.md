# Project Structure and Implementation Patterns

[Previous content remains unchanged up to "New Learnings (March 5, 2025)"]

## New Learnings (March 5, 2025 - Update)

### Skeleton Loading Pattern
1. **Reusable Skeleton Component**
   ```typescript
   interface SkeletonLoaderProps {
     width?: number | string;
     height?: number;
     style?: any;
   }
   ```
   - Use React Native Animated for smooth transitions
   - Implement flexible sizing through props
   - Match skeleton design to actual content
   - Apply consistent animation timing

2. **Loading State Management**
   ```typescript
   const [initialLoading, setInitialLoading] = useState(true);

   useEffect(() => {
     const timer = setTimeout(() => {
       setInitialLoading(false);
     }, 1500);
     return () => clearTimeout(timer);
   }, []);
   ```
   - Separate initial loading from refresh loading
   - Clean up timers to prevent memory leaks
   - Use conditional rendering for loading states

### React Hooks Best Practices
1. **Hook Order Consistency**
   ```typescript
   // Define all hooks at the top level
   const [state, setState] = useState();
   const callback = useCallback(() => {}, []);
   useEffect(() => {}, []);
   ```
   - Maintain consistent hook order across renders
   - Define hooks before any conditional logic
   - Group related hooks together

2. **Memoization Strategy**
   ```typescript
   // Render functions should be memoized
   const renderHeader = useCallback(() => (
     <View>
       <Text>Header Content</Text>
     </View>
   ), [dependencies]);
   ```
   - Memoize render functions for performance
   - Include all dependencies in dependency array
   - Use for complex render functions

### Google Sign-in Integration
1. **Simplified Profile Management**
   - Remove local profile editing for Google-managed data
   - Keep app-specific preferences separate
   - Use Google profile data for display

2. **Authentication State**
   ```typescript
   type AuthState = {
     isAuthenticated: boolean;
     user: {
       name: string;
       email: string;
       photoURL: string;
     } | null;
   };
   ```
   - Clear separation between Google and app data
   - Type-safe user information handling
   - Consistent auth state management

### Performance Optimization Techniques
1. **FlatList with Loading States**
   ```typescript
   <FlatList
     data={data}
     renderItem={renderItem}
     ListHeaderComponent={renderHeader}
     ListFooterComponent={renderFooter}
     onEndReached={loadMore}
     refreshControl={
       <RefreshControl
         refreshing={refreshing}
         onRefresh={handleRefresh}
       />
     }
   />
   ```
   - Implement infinite scroll with loading indicators
   - Show skeleton loading for initial load
   - Handle refresh and load more separately

2. **Component Organization**
   ```typescript
   // Separate rendering logic
   const renderContent = () => (/* main content */);
   const renderSkeletons = () => (/* loading state */);

   return (
     <View>
       {isLoading ? renderSkeletons() : renderContent()}
     </View>
   );
   ```
   - Clean separation of loading and content states
   - Reusable rendering functions
   - Clear conditional rendering

### UI/UX Enhancement Patterns
1. **Breaking News Removal**
   - Evaluate UI elements based on user value
   - Consider vertical space efficiency
   - Maintain consistent news presentation

2. **Profile Screen Simplification**
   ```typescript
   type RootStackParamList = {
     Login: undefined;
     Bookmarks: undefined;
     // Remove EditProfile route
   };
   ```
   - Remove unnecessary navigation routes
   - Simplify user interface based on auth flow
   - Focus on essential functionality

### Error Prevention
1. **Navigation Type Safety**
   ```typescript
   type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
   const navigation = useNavigation<ProfileScreenNavigationProp>();
   ```
   - Define strict navigation types
   - Remove unused routes from type definitions
   - Ensure type-safe navigation calls

2. **Component Dependencies**
   - Consider authentication flow in component design
   - Manage feature flags through configuration
   - Implement proper error boundaries

### Development Process Improvements
1. **Commit Organization**
   - Group related changes in single commits
   - Use descriptive commit messages
   - Follow semantic versioning patterns

2. **Code Maintainability**
   - Document component dependencies
   - Maintain clear separation of concerns
   - Keep consistent code style
