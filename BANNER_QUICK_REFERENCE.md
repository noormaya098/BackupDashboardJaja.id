# Quick Reference Guide - Banner Management Feature

## 📂 Folder Structure
```
src/pages/banner/
├── bannerList.jsx      # Main list page (grid cards)
├── addBanner.jsx       # Add new banner form
├── editBanner.jsx      # Edit banner form (with detail fetch)
└── detailBanner.jsx    # View banner details
```

## 🌐 Routes
```javascript
/dashboard/banner              → BannerList (main page)
/dashboard/banner/add          → AddBanner
/dashboard/banner/edit/:id     → EditBanner
/dashboard/banner/detail/:id   → DetailBanner
```

## 🔌 API Endpoints

### Get All Banners
```
GET /nimda/banner-slider
Response: { code: 200, data: [...] }
```

### Get Banner Detail
```
GET /nimda/banner-slider/{id}
Response: { code: 200, data: {...} }
```

### Create Banner
```
POST /seller/v2/banner
Content-Type: multipart/form-data

Fields:
- banner (File)
- link (String)
- type_web (String: 'web', 'mobile', 'desktop')
- is_platform (Number: 0 or 1)
- status (Number: 0 or 1)
- sort (Number: 1-100)
```

### Update Banner
```
PUT /nimda/banner-slider/{id}
Content-Type: multipart/form-data

Same fields as Create (banner is optional)
```

### Toggle Status
```
PATCH /nimda/banner-slider/{id}
Content-Type: application/json

Body: { is_platform: 0 | 1 }
```

### Delete Banner
```
DELETE /nimda/banner-slider/{id}
```

## 🎯 Key Features

| Feature | Location | Details |
|---------|----------|---------|
| List Banners | bannerList.jsx | Grid cards with preview, fetch from API |
| Add Banner | addBanner.jsx | Form with image upload, POST /seller/v2/banner |
| Edit Banner | editBanner.jsx | Fetch detail first, PUT /nimda/banner-slider/{id} |
| View Details | detailBanner.jsx | Full info in Descriptions component |
| Toggle Status | bannerList.jsx | PATCH with is_platform value |
| Delete Banner | bannerList.jsx/detailBanner.jsx | Modal confirm, DELETE request |

## 📦 Dependencies Used
- react-router-dom (for navigation)
- antd (UI components)
- tailwindcss (styling)
- file-saver (for exports)

## 🔐 Headers Required
```javascript
headers: {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  // 'Content-Type': 'multipart/form-data' (auto set by browser for FormData)
}
```

## 📊 Data Structure

### Banner Object
```javascript
{
  id: number,
  banner_image: string,        // Image URL
  link: string,                // Banner link/URL
  type_web: string,            // 'web', 'mobile', 'desktop'
  is_platform: 0 | 1,          // Active in platform
  status: 0 | 1,               // General status
  sort: number,                // Display order (1-100)
  created_at: string,          // Timestamp
  updated_at: string,          // Timestamp
}
```

## 🎨 UI Components Used
```javascript
// From Ant Design
- Card              → Banner cards display
- Button            → Actions buttons
- Form              → Banner form
- Upload            → Image upload
- Select            → Type dropdown
- Switch            → Toggle switches
- Input             → Text inputs
- InputNumber       → Sort number input
- Modal             → Confirmations
- Spin              → Loading state
- Tag               → Status badges
- Descriptions      → Detail view
- message           → Notifications

// From React Router
- useNavigate       → Navigation
- useParams         → Get route params
- Link              → Link to detail

// From Tailwind CSS
- grid/grid-cols    → Responsive grid
- gap-*             → Spacing
- w-full/sm:w-auto → Responsive width
- text-*            → Typography
- bg-*              → Background colors
```

## ✨ Styling Highlights

### Card Grid
```javascript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

### Button Styles
```javascript
Primary:     bg-blue-500 border-blue-500
Success:     bg-green-500 border-green-500
Danger:      danger (built-in red)
Secondary:   bg-orange-500 border-orange-500
```

### Tag Colors (Status)
```javascript
is_platform: 
  - 1 (Aktif) → color="green"
  - 0 (Tidak Aktif) → color="red"

status:
  - 1 (Aktif) → color="blue"
  - 0 (Tidak Aktif) → color="volcano"
```

## 🔄 Component Lifecycle

### BannerList
1. Component mount → fetchBanners()
2. Display grid of banner cards
3. User clicks action button → Navigate or Fetch data
4. Toggle/Delete triggers API → Update state
5. Notify user with message notification

### AddBanner
1. Component mount → Initialize form with defaults
2. User selects file → Preview in upload component
3. User fills form → Validates required fields
4. Submit → FormData POST to /seller/v2/banner
5. Success → Navigate to /dashboard/banner

### EditBanner
1. Component mount → Fetch detail from /nimda/banner-slider/{id}
2. Form loaded → Pre-fill with banner data
3. Show image preview (if exists)
4. User modifies form
5. Submit → FormData PUT to /nimda/banner-slider/{id}
6. Success → Navigate to /dashboard/banner

### DetailBanner
1. Component mount → Fetch detail from /nimda/banner-slider/{id}
2. Display full banner info in Descriptions
3. Show large image preview
4. User can click Edit or Delete buttons

## 🚨 Error Handling

All components handle:
- Network errors
- Invalid tokens (redirect to login)
- 404 responses
- Invalid form data
- API validation errors

Messages displayed:
- Success: message.success()
- Error: message.error()
- Confirm: Modal.confirm()

## 📱 Responsive Breakpoints

```javascript
Mobile:  grid-cols-1
Tablet:  sm:grid-cols-2  (640px+)
Desktop: lg:grid-cols-3  (1024px+)
```

## 🎓 Code Examples

### Fetch Banners
```javascript
const fetchBanners = async () => {
  const response = await fetch('https://apidev.jaja.id/nimda/banner-slider', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `${token}`,
    },
  });
  const result = await response.json();
  setBanners(result.data);
};
```

### Create Banner
```javascript
const formData = new FormData();
formData.append('banner', fileList[0].originFileObj);
formData.append('link', values.link);
formData.append('type_web', values.type_web);
formData.append('is_platform', values.is_platform ? 1 : 0);
formData.append('status', values.status ? 1 : 0);
formData.append('sort', values.sort);

const response = await fetch('https://apidev.jaja.id/seller/v2/banner', {
  method: 'POST',
  headers: { Authorization: `${token}` },
  body: formData,
});
```

### Toggle Status
```javascript
const response = await fetch(`https://apidev.jaja.id/nimda/banner-slider/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `${token}`,
  },
  body: JSON.stringify({ is_platform: newStatus }),
});
```

---

**Last Updated**: January 30, 2026
**Status**: ✅ Fully Implemented & Ready to Use
