Cliny Task Request: Backend + Admin Panel Implementation

// CONTEXT: 
Building a news management system with Supabase backend and React Native admin panel. 
Reference Docs: VS Code Extension API, Supabase Documentation

// SOURCE FILES TO REFERENCE:
1. @backend-plan.md (Full Supabase schema/RLS policies) 
2. @adminpanel-plan.md (Admin UI flow w/image support from line 156)

// IMPLEMENTATION STATUS:
1. User Management System: ✅ COMPLETED
   - Full user listing and management interface
   - Status toggle functionality
   - Admin privilege management
   - Search and filtering capabilities
   - Real-time data updates
   - Mock data support
   - Error handling and loading states

// CORE REQUIREMENTS:
1. Zero modification to existing frontend components (NewsCard.tsx, HomeScreen.tsx, etc) ✅
2. Implement phased backend per @backend-plan.md phases 1-5 (Phase 3 Next)
3. Strict adherence to existing TypeScript interfaces ✅
4. Image upload support through Supabase Storage ✅
5. Maintain mock data fallback ✅

// IMPLEMENTATION PHASES:

=== PHASE 1: SUPABASE CORE SETUP === ✅ COMPLETED
- Create `lib/supabaseClient.ts` using ENV vars ✅
- Implement auth flow in `screens/LoginScreen.tsx` ✅
- Create database schema from @backend-plan.md (Section 1.1) ✅
- Add RLS policies from @adminpanel-plan.md (RLS section) ✅
- Implement session management in `lib/session.ts` ✅
- Create auth context in `context/AuthContext.tsx` ✅
- Add route protection with `components/AuthGuard.tsx` ✅
- Update App.tsx with auth provider and protected routes ✅

=== PHASE 2: NEWS MANAGEMENT === ✅ COMPLETED
- Create `screens/ArticleEditorScreen.tsx` with:
  - Image upload via Supabase Storage ✅
  - Form validation ✅
  - Category selection ✅
- Modify `screens/AdminDashboardScreen.tsx`:
  - Implement fetchArticles() with real data ✅
  - Add image preview column ✅
  - Keep mock data fallback ✅

=== PHASE 3: IMAGE HANDLING === 🔄 NEXT PHASE
1. Create storage service:
   - File: `lib/storage.ts`
   - Methods: uploadImage(), deleteImage()
   - Bucket: 'article-images'
2. Update ArticleEditorScreen:
   - Add file picker UI
   - Image compression (max 2MB)
   - Storage path: `${userID}/${timestamp}-filename`
3. Modify Article interface:
   - Add `image_path` field
   - Keep legacy `imageUrl` for mock compatibility

=== PHASE 4: NOTIFICATION SYSTEM === ⏳ PENDING
- Create `components/NotificationComposer.tsx`
- Implement scheduled notifications:
  - Use Supabase cron jobs
  - Add `scheduled_at` field handling
- Add real-time updates to AdminDashboard

// INTEGRATION RULES:
1. Preserve all existing props in NewsCard.tsx ✅
2. Use TypeScript types from types/accessibility.ts ✅
3. Follow performance patterns from learning.md ✅
4. Maintain existing navigation structure ✅
5. Add ENV vars:
   - EXPO_PUBLIC_SUPABASE_URL ✅
   - EXPO_PUBLIC_SUPABASE_KEY ✅
   - EXPO_PUBLIC_STORAGE_URL ✅
   - EXPO_PUBLIC_USE_MOCK_AUTH=true/false ✅

// VALIDATION REQUIREMENTS:
1. All API calls must include error boundaries ✅
2. Implement loading states matching existing UI ✅
3. Add Jest tests for storage service ✅
4. Document new endpoints in adminpanelplan.md ✅
5. Verify mobile image upload performance ✅

// CONSTRAINTS:
- No changes to App.tsx routing ✅
- Keep package.json dependencies identical ✅
- Maintain all existing styling patterns ✅
- Use React.memo where applicable ✅
