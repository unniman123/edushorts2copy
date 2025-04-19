# Branch.io Deep Linking Implementation Plan

## Phase 1: Setup and Configuration
1. Create new branch: `feature/branch-deep-linking`
2. Update Android Configuration
   - Verify SDK versions in android/build.gradle
     ```gradle
     compileSdkVersion = 35
     targetSdkVersion = 34
     minSdkVersion = 24
     ```
   - Add Branch.io Maven repository
   - Add Branch SDK dependency

3. Configure AndroidManifest.xml
   ```xml
   <meta-data android:name="io.branch.sdk.BranchKey" android:value="key_live_mtk16153Ngoe3o4XBsd8iehnFDichSM4"/>
   <meta-data android:name="io.branch.sdk.BranchKey.test" android:value="key_test_msd11792Nogd5j81wCe6hnbpstfgbSQG"/>
   ```

## Phase 2: Frontend Implementation

1. Create Branch Utility Module
   ```typescript
   // utils/branchHelper.ts
   import branch from 'react-native-branch';
   
   export const createBranchLink = async (articleId: string, articleData: any) => {
     const branchUniversalObject = await branch.createBranchUniversalObject(`article/${articleId}`, {
       title: articleData.title,
       contentDescription: articleData.summary,
       contentMetadata: {
         customMetadata: {
           articleId: articleId,
           category: articleData.category?.name
         }
       }
     });

     const linkProperties = {
       feature: 'share',
       channel: 'app'
     };

     return await branchUniversalObject.generateShortUrl(linkProperties);
   };
   ```

2. Modify ArticleDetailScreen Share Function
   ```typescript
   // ArticleDetailScreen.tsx
   const handleShare = async () => {
     if (!article) return;
     try {
       const { url } = await createBranchLink(articleId, article);
       await Share.share({
         message: `Check out this article in Edushorts: ${article.title}\n\n${url}`,
         url: url
       });
     } catch (error) {
       console.error('Error sharing:', error);
     }
   };
   ```

3. Implement Deep Link Handling
   ```typescript
   // App.tsx
   useEffect(() => {
     branch.subscribe(({ error, params, uri }) => {
       if (error) {
         console.error('Error from Branch:', error);
         return;
       }
       
       if (params.$deeplink_path) {
         const articleId = params.articleId;
         if (articleId) {
           navigation.navigate('ArticleDetail', { articleId });
         }
       }
     });
   }, []);
   ```

## Phase 3: Testing

1. Deep Link Testing Scenarios
   - Fresh install + deep link
   - App in background + deep link
   - App in foreground + deep link
   - Share functionality
   - Link analytics

2. Test Cases
   ```typescript
   // __tests__/deeplinking.test.ts
   describe('Deep Linking', () => {
     test('creates valid branch link', async () => {
       const link = await createBranchLink('123', mockArticleData);
       expect(link).toBeDefined();
       expect(link.url).toContain('lh1wg.app.link');
     });
   });
   ```

## Phase 4: Analytics and Monitoring

1. Implement Branch Analytics
   ```typescript
   const trackArticleView = async (articleId: string) => {
     const event = new branch.BranchEvent(branch.BranchEvent.ViewItem);
     event.contentItems = [{
       articleId: articleId,
       type: 'article'
     }];
     await event.logEvent();
   };
   ```

## Phase 5: Deployment Checklist

1. Testing Verification
   - [ ] Deep linking works in all scenarios
   - [ ] Share functionality generates correct links
   - [ ] Analytics are being tracked properly

2. Documentation Updates
   - [ ] Update README with deep linking setup
   - [ ] Add testing instructions
   - [ ] Document analytics implementation

3. Release Steps
   - [ ] Create PR with all changes
   - [ ] Update app version
   - [ ] Test on staging environment
   - [ ] Deploy to production

## Branch.io Configuration Details

- Live Branch Key: key_live_mtk16153Ngoe3o4XBsd8iehnFDichSM4
- Test Branch Key: key_test_msd11792Nogd5j81wCe6hnbpstfgbSQG
- Default Domain: lh1wg.app.link
- Alternate Domain: lh1wg-alternate.app.link
- Package Name: com.ajilkojilgokulravi.unniman