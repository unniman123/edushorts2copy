import branch, { BranchEvent } from 'react-native-branch';
import { Platform } from 'react-native';

class BranchHelper {
    private static instance: BranchHelper;
    private retryAttempts = 3;
    private retryDelay = 1000; // 1 second
    private isInitialized = false;

    private constructor() {
        // Branch is initialized in native code (MainActivity.kt and MainApplication.kt)
        // We just need to set up event handlers here
        this.setupBranchListeners();
    }

    static getInstance(): BranchHelper {
        if (!BranchHelper.instance) {
            BranchHelper.instance = new BranchHelper();
        }
        return BranchHelper.instance;
    }

    private setupBranchListeners(): void {
        try {
            // No need to add any specific listeners here
            // Branch is initialized in native code

            // Set this flag to indicate Branch is ready
            this.isInitialized = true;
            console.log('Branch SDK listeners set up successfully');
        } catch (error) {
            console.error('Failed to set up Branch SDK listeners:', error);
        }
    }

    async createBranchLink(articleId: string, articleData: any): Promise<string> {
        // Check if Branch is initialized
        if (!this.isInitialized) {
            console.warn('Branch SDK not initialized yet, but proceeding anyway');
        }

        let attempts = 0;

        while (attempts < this.retryAttempts) {
            try {
                const branchUniversalObject = await branch.createBranchUniversalObject(
                    `article/${articleId}`,
                    {
                        title: articleData.title,
                        contentDescription: articleData.summary,
                        contentMetadata: {
                            customMetadata: {
                                articleId,
                                category: articleData.category?.name,
                                platform: Platform.OS,
                                timestamp: new Date().toISOString()
                            }
                        }
                    }
                );

                const linkProperties = {
                    feature: 'share',
                    channel: 'app',
                    campaign: 'article_share',
                    stage: 'new_share',
                    tags: [articleData.category?.name || 'uncategorized']
                };

                const controlParams = {
                    $desktop_url: `https://edushortlinks.netlify.app/article/${articleId}`,
                    $android_url: Platform.OS === 'android' ? 'market://details?id=com.ajilkojilgokulravi.unniman' : undefined,
                    $ios_url: Platform.OS === 'ios' ? '[YOUR_APP_STORE_LINK]' : undefined
                };

                const { url } = await branchUniversalObject.generateShortUrl(linkProperties, controlParams);
                return url;

            } catch (error: any) { // Explicitly type error as any for now
                attempts++;
                if (attempts === this.retryAttempts) {
                    throw new Error(`Failed to create Branch link after ${this.retryAttempts} attempts: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
        throw new Error('Unexpected error in createBranchLink');
    }

    async setupBranchSubscription(navigation: any): Promise<() => void> {
        // Check if Branch is initialized
        if (!this.isInitialized) {
            console.warn('Branch SDK not initialized yet, but proceeding anyway');
        }

        const subscriber = branch.subscribe(({ error, params }) => {
            if (error) {
                console.error('Error from Branch:', error);
                return;
            }

            try {
                console.log('Branch deep link params:', params);
                if (params && params.$deeplink_path) { // Add check for params
                    const articleId = params.articleId;
                    if (articleId) {
                        navigation.navigate('ArticleDetail', { articleId });
                    }
                }
            } catch (e) {
                console.error('Error handling deep link:', e);
            }
        });

        return () => subscriber();
    }

    async trackShare(articleId: string): Promise<void> {
        // Check if Branch is initialized
        if (!this.isInitialized) {
            console.warn('Branch SDK not initialized yet, but proceeding anyway');
        }

        try {
            // Create a Branch Universal Object for the article
            const branchUniversalObject = await branch.createBranchUniversalObject(
                `article/${articleId}`,
                {
                    title: 'Article Shared',
                    contentMetadata: {
                        customMetadata: {
                            articleId,
                            platform: Platform.OS,
                            timestamp: new Date().toISOString()
                        }
                    }
                }
            );

            // Create and log the share event using a direct string instead of BranchEvent.Share constant
            try {
                // Use 'SHARE' as a direct string instead of BranchEvent.Share
                const event = new BranchEvent('SHARE');
                // Set content items directly
                event.contentItems = [branchUniversalObject];
                await event.logEvent();
                console.log('Share event tracked successfully');
            } catch (e) {
                console.error('Error tracking share event:', e);
            }
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }
}

export default BranchHelper.getInstance();