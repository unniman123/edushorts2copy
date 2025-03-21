Backend & Database Technical Specification
1. Database Schema
1.1 Tables Structure
auth.users (Supabase Auth Default)

id (uuid, PK)
email
encrypted_password
email_confirmed_at
last_sign_in_at
role (admin, user)
public.profiles

id (uuid, PK, references auth.users)
username
avatar_url
notification_preferences
created_at
updated_at
public.news

id (uuid, PK)
title
summary
content
image_path (Supabase Storage path)
category_id (FK)
source_url
source_name
source_icon
created_at
updated_at
created_by (FK to auth.users)
status (draft/published)
view_count
public.categories

id (uuid, PK)
name
description
created_at
is_active
public.saved_articles

id (uuid, PK)
user_id (FK to auth.users)
article_id (FK to news)
saved_at
is_read
public.article_analytics

id (uuid, PK)
article_id (FK to news)
event_type (view/share/save)
user_id (FK to auth.users)
timestamp
metadata (JSONB)
2. Row Level Security (RLS) Policies
2.1 News Table Policies
- anyone can read published news
- only admin can create news
- only admin can update their own news
- only admin can delete their own news
2.2 Categories Table Policies
- anyone can read categories
- only admin can create/update/delete categories
2.3 Saved Articles Policies
- users can read their own saved articles
- users can save/unsave articles
- admins can view all saved articles (for analytics)
2.4 Profiles Policies
- users can read their own profile
- users can update their own profile
- admins can read all profiles
3. Database Triggers
3.1 News Triggers
- after_news_insert: Update category counts
- after_news_view: Update view counts
- after_news_update: Log changes in audit table
3.2 Analytics Triggers
- after_analytics_insert: Update aggregated metrics
4. API Layer
4.1 Public Endpoints
GET /news
- Pagination support
- Category filtering
- Search functionality
- Sort by date/popularity

GET /news/:id
- Single article details
- Increment view count
- Return related articles

GET /categories
- List all active categories
- Category article counts
4.2 Authenticated User Endpoints
POST /saved-articles
- Save article for user

DELETE /saved-articles/:id
- Remove saved article

GET /profile
- Get user profile
- Get saved articles
- Get reading history

PATCH /profile
- Update notification preferences
- Update profile details
4.3 Admin Endpoints
POST /admin/news
- Create news article
- Upload images
- Set categories

PUT /admin/news/:id
- Update news article
- Modify images
- Update categories

DELETE /admin/news/:id
- Remove news article
- Clean up associated images

GET /admin/analytics
- View article metrics
- User engagement stats
- Category performance
5. Security Implementation
5.1 Authentication
- JWT based auth using Supabase Auth
- Refresh token rotation
- Rate limiting on auth endpoints
- Password policies enforcement
5.2 Authorization
- Role-based access (admin/user)
- Resource-based permissions
- API key authentication for admin panel
6. Supabase Storage Configuration
6.1 Storage Buckets
news-images/
  ├── original/      # Original uploads
  ├── thumbnails/    # Generated thumbnails
  └── processed/     # Optimized images
6.2 Storage Policies
- Public read access for all images
- Admin-only write access
- Size limits: 5MB per image
- Allowed formats: jpg, png, webp
7. Mobile App Integration
7.1 Supabase Client Setup
- Environment configuration
- Auth state management
- Real-time subscriptions
- Offline support strategy
7.2 Data Sync
- Real-time updates for news
- Background sync for saved articles
- Optimistic updates
- Error handling & retry logic
8. Testing Strategy
8.1 Database Tests
- RLS policy tests
- Trigger functionality
- Constraint validation
- Performance benchmarks
8.2 API Tests
- Endpoint functionality
- Authentication flows
- Rate limiting
- Error handling
8.3 Integration Tests
- Mobile app connectivity
- Real-time functionality
- Image upload/delivery
- Push notifications
9. Monitoring & Alerts
9.1 Metrics to Monitor
- API response times
- Database query performance
- Storage usage
- Error rates
- User engagement
9.2 Alert Conditions
- API errors > 1%
- Response time > 200ms
- Storage usage > 80%
- Failed authentications
10. Push Notification System
10.1 Notification Types
- Breaking news alerts
- Category-specific updates
- Personalized recommendations
- System announcements
10.2 Notification Table
public.notifications
- id (uuid, PK)
- title
- body
- type (breaking/category/personal)
- target_users (array of user_ids)
- scheduled_for
- sent_at
- status (scheduled/sent/failed)
11. Content Management
11.1 Draft System
- Draft saving
- Auto-save functionality
- Version history
- Preview mode
11.2 Media Management
public.media_assets
- id (uuid, PK)
- file_path
- file_type
- size
- dimensions
- uploaded_by
- created_at
- usage_count
12. SEO & Deep Linking
12.1 SEO Table
public.seo_metadata
- article_id (FK to news)
- meta_title
- meta_description
- canonical_url
- og_image
12.2 Deep Link Configuration
- Article sharing links
- Category deep links
- User profile links
- Dynamic link configuration
13. Caching Strategy
13.1 Cache Layers
- Redis for real-time data
- CDN for static assets
- Browser cache policies
- Mobile app cache
13.2 Cache Invalidation
- Time-based expiration
- Event-based purging
- Selective invalidation
14. Error Handling & Logging
14.1 Error Tracking
public.error_logs
- id (uuid, PK)
- error_type
- message
- stack_trace
- context
- user_id
- created_at
- status (new/investigating/resolved)
14.2 Audit Logging
public.audit_logs
- id (uuid, PK)
- action
- entity_type
- entity_id
- user_id
- changes (JSONB)
- ip_address
- timestamp
15. Performance Optimization
15.1 Database Indexes
- B-tree indexes for exact matches
- GiST indexes for text search
- Partial indexes for filtered queries
15.2 Query Optimization
- Materialized views for analytics
- Parallel query execution
- Connection pooling
18. Mobile-Specific Features
18.1 Offline Mode
- Offline data storage
- Sync queue for operations
- Conflict resolution
18.2 Progressive Loading
- Lazy image loading
- Infinite scroll support
- Prefetching strategy
19. Analytics & Reporting
19.1 User Analytics
- Reading patterns
- Category preferences
- Engagement metrics
- Retention analysis
19.2 Content Analytics
- Popular articles
- Category performance
- Peak usage times
- Sharing statistics
20. Security Enhancements
20.1 Data Encryption
- At-rest encryption
- In-transit encryption
- Field-level encryption
20.2 Security Headers
- CORS policy
- CSP configuration
- XSS protection
- HSTS implementation
This enhanced PRD now covers all aspects of:

Data management
User experience
Performance
Security
Monitoring
Recovery
Analytics
Mobile optimization
Content delivery
Error handling
1. Comprehensive Analytics System
21.1 Analytics Tables
User Activity Analytics
public.user_activity_logs
- id (uuid, PK)
- user_id (FK to auth.users)
- session_id
- event_type (login/logout/view/scroll/share)
- timestamp
- device_info
- location_data
- duration
Content Analytics
public.content_analytics
- id (uuid, PK)
- article_id (FK to news)
- views_count
- unique_views_count
- average_read_time
- bounce_rate
- scroll_depth
- date
Engagement Analytics
public.engagement_metrics
- id (uuid, PK)
- article_id (FK to news)
- shares_count
- saves_count
- comments_count
- click_through_rate
- social_shares (JSONB for platform-wise shares)
Category Performance
public.category_analytics
- id (uuid, PK)
- category_id (FK to categories)
- total_views
- unique_readers
- average_engagement
- trending_score
- date
21.2 Real-time Analytics Dashboard
Overview Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Current Online Users
- Peak Usage Times
Content Performance
- Top Performing Articles
- Trending Categories
- Popular Topics
- Share/Save Ratios
User Engagement
- Average Session Duration
- Pages per Session
- Bounce Rate
- Return User Rate
Reader Behavior
- Reading Patterns
- Category Preferences
- Peak Reading Hours
- Device Usage
21.3 Analytics API Endpoints
Public Analytics
GET /analytics/trending
- Top articles
- Popular categories
- Trending topics

GET /analytics/article/:id
- View count
- Share count
- Save count
- Average read time
Admin Analytics
GET /admin/analytics/dashboard
- Real-time user count
- Today's performance
- Engagement metrics
- Content performance

GET /admin/analytics/reports
- Custom date ranges
- Category performance
- User behavior
- Content insights
21.4 Analytics Events Tracking
User Events
- App Opens
- Article Views
- Time Spent Reading
- Scroll Depth
- Share Actions
- Save Actions
- Category Selection
- Search Queries
System Events
- App Performance
- Error Rates
- API Response Times
- Cache Hit Rates
21.5 Analytics Processing
Real-time Processing
- Live user count
- Current trending articles
- Active session tracking
- Real-time notifications
Batch Processing
- Daily aggregations
- Weekly reports
- Monthly summaries
- Trend analysis
21.6 Analytics Visualization
Dashboard Widgets
- Line charts for trends
- Bar charts for comparisons
- Heat maps for user activity
- Pie charts for distributions
Interactive Reports
- Filterable data tables
- Exportable reports
- Custom date ranges
- Drill-down capabilities
21.7 Analytics Integration
Mobile App Integration
- Event tracking
- Performance monitoring
- User behavior analysis
- Error tracking
Admin Panel Integration
- Real-time metrics
- Report generation
- Data export
- Alert configuration
21.8 Analytics Security
Data Privacy
- Data anonymization
- PII protection
- GDPR compliance
- Data retention policies
Access Control
- Role-based access
- Data filtering
- Export restrictions
- Audit logging