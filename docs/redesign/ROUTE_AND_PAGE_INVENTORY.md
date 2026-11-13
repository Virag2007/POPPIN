# POPPIN — Route & Page Inventory Specification

<!-- redesign:route-inventory v1.0.0 -->

## 1. Overview & Architecture Segmentation

The application route architecture is strictly bifurcated into two environments:
1. **Public Shell (Unauthenticated):** Landing, Login, Registration, Password Recovery. Does not render the application sidebar.
2. **Authenticated Shell (Protected):** Home Feed, Communities, Messages, Profiles, Settings. Renders the persistent left navigation sidebar and topbar with notifications popover.

---

## 2. Public Route Inventory

### 2.1 Landing Page (`/`)
- **Route Path:** `/`
- **Purpose:** Public storefront communicating POPPIN's value proposition as a social identity and community platform for creative builders.
- **Access Permissions:** Public (unauthenticated visitors). Authenticated users visiting `/` are seamlessly redirected to `/feed`.
- **Main Components:**
  - `LandingNavbar` (Logo, Login link, Get Started CTA).
  - `HeroSection` (Unbounded display title, live handle probe widget, dual CTAs).
  - `ProductShowcase` (Interactive mock previews of builder profiles, media feeds, and chat).
  - `FeatureGrid` (Bento layout highlighting Identity, Communities, and Real-Time Messaging).
  - `LandingFooter` (Brand links, legal notes, credits).
- **API Dependencies:**
  - `GET /api/v1/usernames/availability?username={handle}`
- **Loading State:** Instant skeleton placeholder for handle probe widget.
- **Empty State:** N/A (static content).
- **Error State:** Handle probe shows subtle inline error message if availability check fails.

---

### 2.2 Login Page (`/login`)
- **Route Path:** `/login`
- **Purpose:** User authentication via email/password or Google OAuth.
- **Access Permissions:** Public. Authenticated users redirected to `/feed`.
- **Main Components:**
  - `AuthCard` (Centered monochromatic container).
  - `LoginForm` (Email input, password input with toggle, Remember Me, Forgot Password link).
  - `GoogleAuthButton` (OAuth trigger).
- **API Dependencies:**
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/google`
- **Loading State:** Button shows Lucide `Loader2` spinner and enters disabled state; inputs locked.
- **Empty State:** N/A.
- **Error State:** Inline error banner with `AlertCircle` ("Invalid email or password").

---

### 2.3 Registration Page (`/register`)
- **Route Path:** `/register`
- **Purpose:** New user account creation with instant handle verification.
- **Access Permissions:** Public. Authenticated users redirected to `/feed`.
- **Main Components:**
  - `RegisterCard` (Centered container).
  - `RegisterForm` (Email, password, password confirmation, desired username with live debounced availability indicator).
- **API Dependencies:**
  - `GET /api/v1/usernames/availability?username={handle}`
  - `POST /api/v1/auth/register`
- **Loading State:** Registration submission shows button spinner and disables inputs.
- **Empty State:** N/A.
- **Error State:** Specific field error banners (e.g. "Email already in use", "Username already taken").

---

### 2.4 Forgot Password (`/forgot-password`) & Reset (`/reset-password`)
- **Route Path:** `/forgot-password`, `/reset-password?token=...`
- **Purpose:** Secure password recovery flow.
- **Access Permissions:** Public.
- **Main Components:**
  - `ForgotPasswordForm` (Email input, send recovery link trigger).
  - `ResetPasswordForm` (New password, confirm password, token verification).
- **API Dependencies:**
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
- **Loading State:** Spinner on submit button.
- **Empty State:** N/A.
- **Error State:** "Reset token is invalid or has expired."

---

## 3. Onboarding Route Inventory

### 3.1 Progressive Onboarding (`/onboarding`)
- **Route Path:** `/onboarding`
- **Purpose:** 6-step progressive profile completion for new users before entering the main application.
- **Access Permissions:** Protected (Authenticated users who have not completed onboarding).
- **Main Components:**
  - `OnboardingWizard` (Step progress bar, step navigation controls).
  - `Step1Handle`: Verified username and display name.
  - `Step2Avatar`: Profile picture upload via Cloudinary.
  - `Step3Bio`: Short bio and title/role.
  - `Step4Skills`: Technical skills and interests selector.
  - `Step5Communities`: Suggested communities to join.
  - `Step6Finish`: Confirmation and transition to `/feed`.
- **API Dependencies:**
  - `GET /api/v1/onboarding`
  - `PUT /api/v1/onboarding/step-1`
  - `PUT /api/v1/onboarding/step-2`
  - `POST /api/v1/onboarding/complete`
  - `POST /api/v1/cloudinary/signature`
- **Loading State:** Skeleton card during step transition.
- **Empty State:** Community suggestions show empty fallback if no communities exist.
- **Error State:** Step validation error banner; retry prompt on upload failure.

---

## 4. Authenticated Route Inventory

### 4.1 Home Feed (`/feed`)
- **Route Path:** `/feed` (also `/home`)
- **Purpose:** Main social timeline displaying multimedia posts, discussions, and updates from followed users and joined communities.
- **Access Permissions:** Protected (Authenticated users only).
- **Main Components:**
  - `AppSidebar` (Persistent left navigation).
  - `AppTopbar` (Search, Notification Bell, Create Post, User Menu).
  - `PostComposer` (Inline post creation widget with Cloudinary media uploader).
  - `FeedTabs` ("For You", "Following", "Media").
  - `FeedList` (Infinite scrolling post stream).
  - `PostCard` (Author info, text body, media carousel/grid, reaction bar, inline comment trigger).
  - `InlineCommentDrawer` (Threaded comments, reply input directly beneath post).
  - `SuggestedBuildersRail` (Right sidebar showing recommended creators and active communities).
- **API Dependencies:**
  - `GET /api/v1/feed?cursor=...&limit=10&tab=...`
  - `POST /api/v1/posts`
  - `POST /api/v1/posts/[id]/like`
  - `GET /api/v1/posts/[id]/comments`
  - `POST /api/v1/posts/[id]/comments`
- **Loading State:** 3 stacked `PostSkeleton` cards with pulse animation while initial batch loads.
- **Empty State:** Friendly empty state: "Your feed is quiet. Discover communities and follow builders to populate your timeline." with action buttons.
- **Error State:** Error banner with "Retry loading feed" button.

---

### 4.2 Communities Hub (`/communities`)
- **Route Path:** `/communities`
- **Purpose:** Community discovery, category browsing, and community creation.
- **Access Permissions:** Protected.
- **Main Components:**
  - `CommunityCategoryFilter` (Pills: All, Engineering, Design, AI, Founders).
  - `CommunityGrid` (Cards with community avatar, name, tagline, member count, and Quick Join button).
  - `CreateCommunityModal` (Form for name, slug, description, rules, avatar, cover photo).
- **API Dependencies:**
  - `GET /api/v1/communities?category=...&search=...`
  - `POST /api/v1/communities`
  - `POST /api/v1/communities/[id]/join`
- **Loading State:** 6 `CommunityCardSkeleton` placeholders.
- **Empty State:** "No communities found in this category. Be the first to create one!" with "Create Community" button.
- **Error State:** Inline error alert with retry action.

---

### 4.3 Community Detail (`/communities/[slug]`)
- **Route Path:** `/communities/[slug]`
- **Purpose:** Specific community space with banner, guidelines, member roster, and community-scoped posts.
- **Access Permissions:** Protected.
- **Main Components:**
  - `CommunityHeader` (Cover image, avatar, title, description, Join/Leave toggle, member count).
  - `CommunityRulesCard` (Sidebar displaying community guidelines).
  - `CommunityModeratorRoster` (List of moderators and admins).
  - `CommunityPostComposer` (Post directly to this community).
  - `CommunityFeed` (Filtered feed of community posts).
- **API Dependencies:**
  - `GET /api/v1/communities/[slug]`
  - `POST /api/v1/communities/[id]/join`
  - `DELETE /api/v1/communities/[id]/join`
  - `GET /api/v1/communities/[id]/posts`
- **Loading State:** Full-width header skeleton + feed post skeletons.
- **Empty State:** "No posts in this community yet. Start the conversation!"
- **Error State:** 404 "Community not found" with button to explore other communities.

---

### 4.4 Real-Time Messages (`/messages`)
- **Route Path:** `/messages`
- **Purpose:** Low-latency 1-on-1 and group chat with presence, typing indicators, and read receipts.
- **Access Permissions:** Protected.
- **Main Components:**
  - `ConversationList` (Sidebar listing recent chats with unread pills, online status, last message preview).
  - `ChatWindow` (Header with recipient status, message bubble stream, date dividers).
  - `MessageBubble` (Sender/receiver styling, image attachment lightbox, timestamp, read receipt checkmarks).
  - `TypingIndicator` (Animated 3-dot presence bubble).
  - `MessageInput` (Text input, media upload trigger, typing throttling, send button).
  - `NewConversationModal` (User search and group creation).
- **API Dependencies:**
  - Socket.IO connection on `http://localhost:4000`
  - `GET /api/v1/conversations`
  - `GET /api/v1/conversations/[id]/messages`
  - `POST /api/v1/cloudinary/signature`
- **Loading State:** Left column list skeleton + centered chat placeholder skeleton.
- **Empty State:** "Select a conversation or start a new chat" with Lucide `MessageSquare` centerpiece.
- **Error State:** "Disconnected from real-time server. Reconnecting..." banner at top of chat window.

---

### 4.5 User Profile (`/profile` & `/profiles/[username]`)
- **Route Path:** `/profile` (own), `/profiles/[username]` (public)
- **Purpose:** Builder portfolio displaying identity, verified skills, external links, experience, and published posts.
- **Access Permissions:** Protected for own profile; public/protected based on user privacy settings for external views.
- **Main Components:**
  - `ProfileHeader` (Cover photo, avatar, verified handle badge, display name, headline, bio, location, join date).
  - `ProfileStats` (Followers count, Following count, Joined communities count).
  - `ProfileActions` (Edit Profile button for own; Follow/Unfollow, Message, Block/Report buttons for others).
  - `ProfileTabs` (Posts, Communities, Skills & Links, About).
  - `EditProfileModal` (Form for updating headline, bio, links, avatar, cover photo).
- **API Dependencies:**
  - `GET /api/v1/users/me/profile`
  - `GET /api/v1/profiles/[username]`
  - `PATCH /api/v1/users/me/profile`
  - `POST /api/v1/users/[id]/follow`
- **Loading State:** Header skeleton with avatar circle and tab skeletons.
- **Empty State:** "This user hasn't shared any posts yet."
- **Error State:** "User not found or account has been suspended."

---

### 4.6 Account Settings (`/settings`)
- **Route Path:** `/settings`
- **Purpose:** Complete account, privacy, notification, and security controls.
- **Access Permissions:** Protected.
- **Main Components:**
  - `SettingsNav` (Tabs: Profile, Security, Privacy, Notifications, Danger Zone).
  - `SecurityTab` (Password change, active session review).
  - `PrivacyTab` (Profile visibility toggle, direct message permissions).
  - `BlockedUsersTab` (List of currently blocked users with Unblock button).
  - `DangerZoneTab` (Account deletion with double-confirmation modal).
- **API Dependencies:**
  - `GET /api/v1/users/me/account`
  - `PATCH /api/v1/users/me/account`
  - `GET /api/v1/users/me/privacy`
  - `PATCH /api/v1/users/me/privacy`
  - `DELETE /api/v1/users/me`
- **Loading State:** Settings form card skeleton.
- **Empty State:** Blocked users tab shows "You haven't blocked any users."
- **Error State:** Feedback toast with exact error description.

